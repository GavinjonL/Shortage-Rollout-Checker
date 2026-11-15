"""In-memory, fictional demo policy state. No hospital systems are accessed."""

from app.schemas.policy import PolicyRule

_confirmed_rules: list[PolicyRule] = []
_history: list[dict] = []
_reviews: dict[str, dict] = {}


def replace_confirmed_rules(rules: list[PolicyRule]) -> list[PolicyRule]:
    global _confirmed_rules
    _confirmed_rules = [rule.model_copy(update={"confirmed_by_user": True}) for rule in rules]
    _history.append({"version": len(_history) + 1, "rules": [rule.model_dump() for rule in _confirmed_rules]})
    return _confirmed_rules


def get_confirmed_rules() -> list[PolicyRule]:
    return _confirmed_rules

def policy_history() -> list[dict]:
    return list(_history)

def save_rule_review(review: dict) -> dict:
    _reviews[review["rule_id"]] = review
    _history.append({"version": len(_history) + 1, "rules": list(_reviews.values())})
    return review

def get_rule_reviews() -> list[dict]:
    return list(_reviews.values())
