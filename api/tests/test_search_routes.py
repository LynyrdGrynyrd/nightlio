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


def test_search_entries_with_query_and_filters(client):
    headers = _auth_headers(client)

    client.post(
        "/api/mood",
        headers=headers,
        json={
            "mood": 5,
            "date": "2024-01-01",
            "content": "Happy day",
            "selected_options": [],
        },
    )
    client.post(
        "/api/mood",
        headers=headers,
        json={
            "mood": 2,
            "date": "2024-01-02",
            "content": "Tough day",
            "selected_options": [],
        },
    )

    query_resp = client.get(
        "/api/search?q=Happy",
        headers=headers,
    )
    assert query_resp.status_code == 200
    query_results = query_resp.get_json()
    assert len(query_results) == 1
    assert query_results[0]["content"] == "Happy day"

    mood_resp = client.get(
        "/api/search?moods=2&start_date=2024-01-01&end_date=2024-01-03",
        headers=headers,
    )
    assert mood_resp.status_code == 200
    mood_results = mood_resp.get_json()
    assert len(mood_results) == 1
    assert mood_results[0]["mood"] == 2


def test_search_ignores_invalid_moods_param(client):
    headers = _auth_headers(client)

    client.post(
        "/api/mood",
        headers=headers,
        json={
            "mood": 3,
            "date": "2024-02-01",
            "content": "Neutral",
            "selected_options": [],
        },
    )
    client.post(
        "/api/mood",
        headers=headers,
        json={
            "mood": 4,
            "date": "2024-02-02",
            "content": "Good",
            "selected_options": [],
        },
    )

    resp = client.get("/api/search?moods=bad,4x", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 2
