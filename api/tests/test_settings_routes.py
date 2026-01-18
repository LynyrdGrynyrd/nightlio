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


def test_get_settings_sanitizes_pin_hash(client):
    headers = _auth_headers(client)

    resp = client.get("/api/user/settings", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "pin_hash" not in data
    assert data["has_pin"] is False


def test_set_pin_validation(client):
    headers = _auth_headers(client)

    resp = client.put("/api/auth/pin", headers=headers, json={"pin": "12a"})
    assert resp.status_code == 400

    resp = client.put("/api/auth/pin", headers=headers, json={"pin": "123"})
    assert resp.status_code == 400


def test_pin_lifecycle(client):
    headers = _auth_headers(client)

    set_resp = client.put("/api/auth/pin", headers=headers, json={"pin": "1234"})
    assert set_resp.status_code == 200

    verify_resp = client.post(
        "/api/auth/verify-pin",
        headers=headers,
        json={"pin": "1234"},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.get_json()["valid"] is True

    bad_verify = client.post(
        "/api/auth/verify-pin",
        headers=headers,
        json={"pin": "9999"},
    )
    assert bad_verify.status_code == 200
    assert bad_verify.get_json()["valid"] is False

    remove_resp = client.delete("/api/auth/pin", headers=headers)
    assert remove_resp.status_code == 200

    settings_resp = client.get("/api/user/settings", headers=headers)
    assert settings_resp.get_json()["has_pin"] is False


def test_lock_timeout_validation(client):
    headers = _auth_headers(client)

    invalid_resp = client.put(
        "/api/user/settings/lock-timeout",
        headers=headers,
        json={"seconds": "nope"},
    )
    assert invalid_resp.status_code == 400

    negative_resp = client.put(
        "/api/user/settings/lock-timeout",
        headers=headers,
        json={"seconds": -10},
    )
    assert negative_resp.status_code == 400

    ok_resp = client.put(
        "/api/user/settings/lock-timeout",
        headers=headers,
        json={"seconds": 300},
    )
    assert ok_resp.status_code == 200
