from app.data.seed_demo import load_demo_data


def test_sprint_one_demo_dataset_is_complete_and_fictional() -> None:
    dataset = load_demo_data()

    assert len(dataset.departments) == 2
    assert len(dataset.medications) == 3
    assert len(dataset.alternatives) == 1
    assert len(dataset.events) >= 3
    assert len(dataset.findings) == 1
    assert "possible mismatch" in dataset.findings[0].summary.lower()
    assert dataset.configurations[0].id in dataset.findings[0].evidence_ids
