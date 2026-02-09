import base64
import json
from datetime import datetime, timedelta, timezone

from jose import jwt as jose_jwt

from api.app import create_app


def _b64url_json(payload: dict) -> str:
    encoded = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(encoded).rstrip(b"=").decode("ascii")


def _build_none_token(payload: dict) -> str:
    header = {"alg": "none", "typ": "JWT"}
    return f"{_b64url_json(header)}.{_b64url_json(payload)}."


def _future_timestamp(minutes: int = 5) -> int:
    return int((datetime.now(timezone.utc) + timedelta(minutes=minutes)).timestamp())


def _login_and_get_claims(client):
    login = client.post("/api/auth/local/login")
    assert login.status_code == 200
    token = login.get_json()["token"]
    claims = jose_jwt.get_unverified_claims(token)
    return token, claims


def test_verify_accepts_valid_hs256_token():
    app = create_app("testing")
    client = app.test_client()

    token, _claims = _login_and_get_claims(client)
    response = client.post(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert "user" in response.get_json()


def test_verify_rejects_alg_none_token():
    app = create_app("testing")
    client = app.test_client()

    _token, claims = _login_and_get_claims(client)
    forged_payload = {
        "user_id": claims["user_id"],
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": _future_timestamp(),
    }
    forged_token = _build_none_token(forged_payload)

    response = client.post(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {forged_token}"},
    )

    assert response.status_code == 401
    assert "error" in response.get_json()


def test_verify_rejects_unexpected_hmac_algorithm():
    app = create_app("testing")
    client = app.test_client()

    _token, claims = _login_and_get_claims(client)
    signed_hs512 = jose_jwt.encode(
        {
            "user_id": claims["user_id"],
            "iat": int(datetime.now(timezone.utc).timestamp()),
            "exp": _future_timestamp(),
        },
        app.config["JWT_SECRET_KEY"],
        algorithm="HS512",
    )

    verify_response = client.post(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {signed_hs512}"},
    )
    protected_response = client.get(
        "/api/moods",
        headers={"Authorization": f"Bearer {signed_hs512}"},
    )

    assert verify_response.status_code == 401
    assert protected_response.status_code == 401
