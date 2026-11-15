"""Provider-isolated, draft-only AI policy extraction."""

import json
import os
import re
from dataclasses import dataclass
from typing import Any, Protocol

from dotenv import load_dotenv
from openai import APIConnectionError, APIStatusError, APITimeoutError, AuthenticationError, NotFoundError, OpenAI, RateLimitError
from pydantic import ValidationError

from app.ai.prompts import POLICY_DRAFTING_SYSTEM_PROMPT
from app.schemas.policy import DraftPolicyRule, PolicyDraft
from app.services.audit_log import begin_call, finish_call

GROQ_BASE_URL = "https://api.groq.com/openai/v1"


class PolicyExtractionError(Exception):
    """A safe, client-facing error from an AI provider."""

    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class PolicyExtractor(Protocol):
    def extract(self, policy_text: str, policy_id: str) -> PolicyDraft: ...


@dataclass(frozen=True)
class AISettings:
    provider: str
    api_key: str | None
    model: str
    base_url: str | None = None

    @classmethod
    def from_environment(cls) -> "AISettings":
        load_dotenv()
        provider = os.getenv("AI_PROVIDER", "groq").strip().lower()
        if provider == "groq":
            return cls(provider, os.getenv("GROQ_API_KEY"), os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"), GROQ_BASE_URL)
        if provider == "openai":
            return cls(provider, os.getenv("OPENAI_API_KEY"), os.getenv("OPENAI_MODEL", "gpt-5.5"))
        if provider == "mock":
            return cls(provider, None, "mock")
        raise PolicyExtractionError("AI_PROVIDER must be one of: groq, openai, mock.", 500)


def _model_schema() -> dict[str, Any]:
    """Strict Groq schemas require every property to be required, including nullable ones."""
    nullable_string = {"anyOf": [{"type": "string"}, {"type": "null"}]}
    rule_schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "medication_id": nullable_string,
            "department_id": nullable_string,
            "condition": nullable_string,
            "restriction": nullable_string,
            "approved_alternative_id": nullable_string,
            "effective_date": nullable_string,
            "source_excerpt": {"type": "string", "minLength": 1},
            "confirmed_by_user": {"type": "boolean", "enum": [False]},
        },
        "required": [
            "medication_id", "department_id", "condition", "restriction",
            "approved_alternative_id", "effective_date", "source_excerpt",
            "confirmed_by_user",
        ],
    }
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "rules": {"type": "array", "items": rule_schema},
            "ambiguities": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["rules", "ambiguities"],
    }


def _validate_evidence(draft: PolicyDraft, policy_text: str) -> PolicyDraft:
    """Defence in depth: the response must quote the supplied policy, not invent support."""
    normalized_policy = " ".join(policy_text.casefold().split())
    for index, rule in enumerate(draft.rules, start=1):
        excerpt = " ".join(rule.source_excerpt.casefold().split())
        if excerpt not in normalized_policy:
            raise PolicyExtractionError(f"Model returned rule {index} with a source excerpt not found in the policy.", 502)
        if rule.approved_alternative_id is not None:
            alternative = " ".join(rule.approved_alternative_id.casefold().split())
            if alternative in normalized_policy and alternative in excerpt:
                continue

            # Models occasionally add a harmless label such as
            # "MED-B (approved alternative)". Accept only an exact, ID-like
            # token embedded in that label when the policy and quote both contain it.
            id_tokens = re.findall(r"(?<![A-Za-z0-9])[A-Za-z]+(?:[-_][A-Za-z0-9]+)+(?![A-Za-z0-9])", rule.approved_alternative_id)
            supported_id = next(
                (token for token in id_tokens if token.casefold() in normalized_policy and token.casefold() in excerpt),
                None,
            )
            if supported_id is None:
                # Keep the draft usable, but never carry an unverified alternative
                # into a downstream workflow. A pharmacist can correct it on review.
                rule.approved_alternative_id = None
                ambiguity = f"Rule {index}: the model's approved alternative could not be verified from its source excerpt."
                if ambiguity not in draft.ambiguities:
                    draft.ambiguities.append(ambiguity)
                continue
            rule.approved_alternative_id = supported_id
    return draft


class OpenAICompatiblePolicyExtractor:
    def __init__(self, settings: AISettings) -> None:
        if not settings.api_key:
            key_name = "GROQ_API_KEY" if settings.provider == "groq" else "OPENAI_API_KEY"
            raise PolicyExtractionError(f"{key_name} is not configured. Add it to your local .env file.", 503)
        self.settings = settings
        self.client = OpenAI(api_key=settings.api_key, base_url=settings.base_url, timeout=20.0, max_retries=0)

    def extract(self, policy_text: str, policy_id: str) -> PolicyDraft:
        started = begin_call("policy_extraction")
        try:
            response = self.client.chat.completions.create(
                model=self.settings.model,
                messages=[
                    {"role": "system", "content": POLICY_DRAFTING_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Extract a draft from this fictional policy:\n\n{policy_text}"},
                ],
                response_format={"type": "json_schema", "json_schema": {"name": "policy_draft", "strict": True, "schema": _model_schema()}},
            )
            content = response.choices[0].message.content if response.choices else None
            if not content:
                raise PolicyExtractionError("The AI provider returned no draft content.", 502)
            parsed = json.loads(content)
            draft = PolicyDraft.model_validate({"policy_id": policy_id, **parsed})
            result = _validate_evidence(draft, policy_text)
            finish_call("policy_extraction", started, "success")
            return result
        except PolicyExtractionError:
            finish_call("policy_extraction", started, "error")
            raise
        except AuthenticationError as exc:
            finish_call("policy_extraction", started, "error")
            raise PolicyExtractionError("AI provider authentication failed. Check the local API key.", 502) from exc
        except RateLimitError as exc:
            finish_call("policy_extraction", started, "rate_limited")
            raise PolicyExtractionError("AI provider rate limit reached. Wait and try again.", 429) from exc
        except (APITimeoutError, APIConnectionError) as exc:
            finish_call("policy_extraction", started, "unavailable")
            raise PolicyExtractionError("AI provider is unavailable or timed out. Try again later or use AI_PROVIDER=mock.", 503) from exc
        except NotFoundError as exc:
            finish_call("policy_extraction", started, "error")
            raise PolicyExtractionError("Configured AI model is unavailable. Check the model name.", 502) from exc
        except APIStatusError as exc:
            finish_call("policy_extraction", started, "error")
            raise PolicyExtractionError("AI provider rejected the extraction request. Check provider configuration.", 502) from exc
        except (json.JSONDecodeError, ValidationError, KeyError, IndexError, TypeError) as exc:
            finish_call("policy_extraction", started, "invalid_response")
            raise PolicyExtractionError("AI provider returned an invalid policy draft.", 502) from exc


class MockPolicyExtractor:
    """Offline, intentionally conservative mode for demos without an API key."""
    def extract(self, policy_text: str, policy_id: str) -> PolicyDraft:
        return PolicyDraft(
            policy_id=policy_id,
            rules=[],
            ambiguities=["Mock mode does not interpret policies. Configure Groq or OpenAI to create a draft."],
        )


def get_policy_extractor() -> PolicyExtractor:
    settings = AISettings.from_environment()
    if settings.provider == "mock":
        return MockPolicyExtractor()
    return OpenAICompatiblePolicyExtractor(settings)
