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


def test_get_mood_definitions_creates_defaults(client):
    headers = _auth_headers(client)

    resp = client.get("/api/mood-definitions", headers=headers)
    assert resp.status_code == 200

    data = resp.get_json()
    assert len(data) == 5
    assert [definition["score"] for definition in data] == [1, 2, 3, 4, 5]


def test_update_mood_definition_valid(client):
    headers = _auth_headers(client)

    resp = client.put(
        "/api/mood-definitions/3",
        headers=headers,
        json={"label": "Steady", "icon": "😌"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["score"] == 3
    assert data["label"] == "Steady"
    assert data["icon"] == "😌"


def test_update_mood_definition_invalid_score(client):
    headers = _auth_headers(client)

    resp = client.put(
        "/api/mood-definitions/6",
        headers=headers,
        json={"label": "Too High"},
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Score must be between 1 and 5"


def test_update_mood_definition_missing_fields(client):
    headers = _auth_headers(client)

    resp = client.put("/api/mood-definitions/2", headers=headers, json={})
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"]
