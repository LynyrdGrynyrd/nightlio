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


def _create_goal(client, headers):
    resp = client.post(
        "/api/goals",
        headers=headers,
        json={
            "title": "Stay hydrated",
            "description": "Drink enough water",
            "frequency_per_week": 3,
            "frequency_type": "weekly",
            "target_count": 3,
        },
    )
    assert resp.status_code == 201
    return int(resp.get_json()["id"])


def test_reminder_crud_with_message_days_goal_and_active(client):
    headers = _auth_headers(client)
    goal_id = _create_goal(client, headers)

    create_resp = client.post(
        "/api/reminders",
        headers=headers,
        json={
            "time": "08:15",
            "days": [0, 2, 4],
            "message": "Quick check-in",
            "goal_id": goal_id,
            "is_active": False,
        },
    )
    assert create_resp.status_code == 201
    reminder_id = create_resp.get_json()["id"]
    assert isinstance(reminder_id, int) and reminder_id > 0

    list_resp = client.get("/api/reminders", headers=headers)
    assert list_resp.status_code == 200
    reminders = list_resp.get_json() or []
    saved = next((item for item in reminders if item.get("id") == reminder_id), None)
    assert saved is not None
    assert saved["time"] == "08:15"
    assert saved["days"] == [0, 2, 4]
    assert saved["message"] == "Quick check-in"
    assert int(saved["goal_id"]) == goal_id
    assert saved["is_active"] is False

    update_resp = client.put(
        f"/api/reminders/{reminder_id}",
        headers=headers,
        json={
            "time": "09:45",
            "days": [1, 3, 5],
            "message": "Updated reminder",
            "goal_id": None,
            "is_active": True,
        },
    )
    assert update_resp.status_code == 200

    updated_list_resp = client.get("/api/reminders", headers=headers)
    assert updated_list_resp.status_code == 200
    updated_reminders = updated_list_resp.get_json() or []
    updated = next((item for item in updated_reminders if item.get("id") == reminder_id), None)
    assert updated is not None
    assert updated["time"] == "09:45"
    assert updated["days"] == [1, 3, 5]
    assert updated["message"] == "Updated reminder"
    assert updated["goal_id"] is None
    assert updated["is_active"] is True


def test_reminder_validation_errors(client):
    headers = _auth_headers(client)

    invalid_time_resp = client.post(
        "/api/reminders",
        headers=headers,
        json={"time": "25:99", "days": [0, 1], "message": "Bad"},
    )
    assert invalid_time_resp.status_code == 400
    assert "HH:MM" in invalid_time_resp.get_json().get("error", "")

    invalid_days_resp = client.post(
        "/api/reminders",
        headers=headers,
        json={"time": "09:00", "days": [], "message": "Bad"},
    )
    assert invalid_days_resp.status_code == 400
    assert "days" in invalid_days_resp.get_json().get("error", "").lower()

    invalid_goal_resp = client.post(
        "/api/reminders",
        headers=headers,
        json={
            "time": "09:00",
            "days": [0, 1],
            "message": "Unknown goal",
            "goal_id": 999999,
        },
    )
    assert invalid_goal_resp.status_code == 400
    assert "goal_id" in invalid_goal_resp.get_json().get("error", "").lower()

    no_updates_resp = client.put("/api/reminders/123456", headers=headers, json={})
    assert no_updates_resp.status_code == 400
