"""In-memory, fictional demo policy state. No hospital systems are accessed."""

from app.schemas.policy import PolicyRule

_confirmed_rules: list[PolicyRule] = []


def replace_confirmed_rules(rules: list[PolicyRule]) -> list[PolicyRule]:
    global _confirmed_rules
    _confirmed_rules = [rule.model_copy(update={"confirmed_by_user": True}) for rule in rules]
    return _confirmed_rules


def get_confirmed_rules() -> list[PolicyRule]:
    return _confirmed_rules
