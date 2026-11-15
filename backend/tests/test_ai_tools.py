import pytest

from app.ai.tools import dispatch_read_only_tool


def test_read_only_policy_tool_is_allowed():
    assert dispatch_read_only_tool("get_confirmed_policy", {}) == {"rules": []}


@pytest.mark.parametrize("name,args", [("delete_policy", {}), ("update_review_status", {}), ("get_confirmed_policy", {"id": "x"})])
def test_unknown_write_or_argumented_tools_are_rejected(name, args):
    with pytest.raises(ValueError):
        dispatch_read_only_tool(name, args)
