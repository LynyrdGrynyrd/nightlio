import os

import pytest

from api.app import create_app

TEST_DB_PATH = "/tmp/twilightio_test.db"


def _reset_test_db():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture()
def client():
    _reset_test_db()
    app = create_app("testing")
    with app.test_client() as test_client:
        yield test_client
    _reset_test_db()


def _auth_headers(client):
    resp = client.post("/api/auth/local/login")
    assert resp.status_code == 200
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_achievement_definitions_and_progress_contract(client):
    headers = _auth_headers(client)

    definitions_resp = client.get("/api/achievements/definitions", headers=headers)
    assert definitions_resp.status_code == 200
    definitions = definitions_resp.get_json() or []
    assert isinstance(definitions, list)
    assert len(definitions) > 0

    required_definition_keys = {
        "achievement_type",
        "name",
        "description",
        "icon",
        "rarity",
        "category",
        "secret",
        "target",
    }
    definition_by_type = {}
    for definition in definitions:
        assert required_definition_keys.issubset(definition.keys())
        assert isinstance(definition["achievement_type"], str) and definition["achievement_type"]
        assert isinstance(definition["name"], str) and definition["name"]
        assert isinstance(definition["icon"], str) and definition["icon"]
        assert isinstance(definition["secret"], bool)
        assert int(definition["target"]) >= 1
        definition_by_type[definition["achievement_type"]] = definition

    assert len(definition_by_type) == len(definitions)

    progress_resp = client.get("/api/achievements/progress", headers=headers)
    assert progress_resp.status_code == 200
    progress_rows = progress_resp.get_json() or []
    assert isinstance(progress_rows, list)
    assert len(progress_rows) == len(definitions)

    required_progress_keys = {
        "achievement_type",
        "current",
        "max",
        "percent",
        "is_unlocked",
    }
    progress_types = {row["achievement_type"] for row in progress_rows}
    assert progress_types == set(definition_by_type.keys())

    for row in progress_rows:
        assert required_progress_keys.issubset(row.keys())
        assert isinstance(row["is_unlocked"], bool)
        assert 0 <= int(row["percent"]) <= 100
        assert int(row["max"]) >= 1
        assert 0 <= int(row["current"]) <= int(row["max"])

        definition = definition_by_type[row["achievement_type"]]
        assert row["name"] == definition["name"]
        assert row["icon"] == definition["icon"]
        assert row["rarity"] == definition["rarity"]
        assert row["category"] == definition["category"]
        assert int(row["target"]) == int(definition["target"])
        assert row["secret"] is definition["secret"]
