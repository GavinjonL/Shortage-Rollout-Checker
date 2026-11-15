from app.schemas.scenario import TestCase
_cases: list[TestCase] = []
def list_generated_cases() -> list[TestCase]: return list(_cases)

def clear_generated_cases() -> None:
    _cases.clear()
def add_generated_case(test_case: TestCase) -> TestCase:
    if not any(c.id == test_case.id for c in _cases): _cases.append(test_case)
    return test_case
