import json
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


def _parse_custom_days(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        return parsed if isinstance(parsed, list) else []
    return []


def test_goal_route_passes_frequency_contract_fields_through_create_and_update(client):
    headers = _auth_headers(client)

    create_resp = client.post(
        "/api/goals",
        headers=headers,
        json={
            "title": "Custom cadence goal",
            "description": "Runs on specific weekdays",
            "frequency_type": "custom",
            "frequency_per_week": 3,
            "target_count": 3,
            "custom_days": [0, 2, 4],
        },
    )
    assert create_resp.status_code == 201
    goal_id = create_resp.get_json()["id"]
    assert goal_id

    goal_resp = client.get(f"/api/goals/{goal_id}", headers=headers)
    assert goal_resp.status_code == 200
    goal = goal_resp.get_json()
    assert goal["frequency_type"] == "custom"
    assert int(goal["target_count"]) == 3
    assert _parse_custom_days(goal.get("custom_days")) == [0, 2, 4]

    update_resp = client.put(
        f"/api/goals/{goal_id}",
        headers=headers,
        json={
            "frequency_type": "monthly",
            "frequency_per_week": 5,
            "target_count": 5,
        },
    )
    assert update_resp.status_code == 200

    updated_goal_resp = client.get(f"/api/goals/{goal_id}", headers=headers)
    assert updated_goal_resp.status_code == 200
    updated_goal = updated_goal_resp.get_json()
    assert updated_goal["frequency_type"] == "monthly"
    assert int(updated_goal["target_count"]) == 5
