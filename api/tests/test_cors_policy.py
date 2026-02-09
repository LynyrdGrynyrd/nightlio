from api.app import create_app


ALLOWED_ORIGIN = "http://localhost:5173"
DISALLOWED_ORIGIN = "http://malicious.example"


def _preflight(client, origin: str):
    return client.open(
        "/api/moods",
        method="OPTIONS",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
    )


def test_preflight_allows_configured_origin():
    app = create_app("testing")
    client = app.test_client()

    response = _preflight(client, ALLOWED_ORIGIN)

    assert response.status_code in {200, 204}
    assert response.headers.get("Access-Control-Allow-Origin") == ALLOWED_ORIGIN
    allowed_headers = (response.headers.get("Access-Control-Allow-Headers") or "").lower()
    assert "authorization" in allowed_headers
    assert "content-type" in allowed_headers


def test_preflight_blocks_disallowed_origin():
    app = create_app("testing")
    client = app.test_client()

    response = _preflight(client, DISALLOWED_ORIGIN)

    assert response.status_code in {200, 204}
    assert response.headers.get("Access-Control-Allow-Origin") is None


def test_authenticated_request_keeps_cors_headers_for_allowed_origin():
    app = create_app("testing")
    client = app.test_client()

    login = client.post("/api/auth/local/login", headers={"Origin": ALLOWED_ORIGIN})
    assert login.status_code == 200
    token = login.get_json()["token"]

    response = client.get(
        "/api/moods",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == ALLOWED_ORIGIN
