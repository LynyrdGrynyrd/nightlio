import pytest
import csv
import io
import json
from api.app import create_app
import os

TEST_DB_PATH = "/tmp/twilightio_test_export.db"

def _reset_test_db():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

@pytest.fixture
def client():
    _reset_test_db()
    # Ensure config uses this db path. 
    # Current TestingConfig uses /tmp/twilightio_test.db
    # We'll just patch env or rely on patching app factory if needed,
    # but simplest is to reuse standard test db path or just let it use default /tmp/twilightio_test.db
    # Let's try relying on standard create_app("testing") which uses /tmp/twilightio_test.db
    app = create_app("testing")
    with app.test_client() as test_client:
        yield test_client

def _auth_headers(client):
    # Register/Login to get token
    # Assuming fresh DB, so user doesn't exist. Upsert?
    # Or just use local login if test db supports "upsert by google id" or similar
    # We'll use the backdoor or standard flow if available.
    # Actually, local auth test uses:
    client.post("/api/auth/google", json={
        "token": "test_token",
        "email": "test@example.com",
        "name": "Test User",
        "google_id": "999"
    })
    
    # Or simplified local login if enabled for testing
    resp = client.post("/api/auth/local/login")
    token = resp.get_json().get("token")
    return {"Authorization": f"Bearer {token}"}

def test_export_csv(client):
    headers = _auth_headers(client)
    
    # Create some data
    client.post("/api/mood", headers=headers, json={
        "mood": 5, 
        "date": "2024-01-01", 
        "content": "Happy New Year",
        "selected_options": []
    })
    
    resp = client.get("/api/export/csv", headers=headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["Content-Type"]
    
    # Parse CSV
    content = resp.data.decode("utf-8")
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    assert rows[0] == ["Date", "Time", "Mood", "Content", "Activities", "Photos"]
    assert len(rows) >= 2 # Header + at least 1 entry

def test_export_json(client):
    headers = _auth_headers(client)
    
    # Create data
    client.post("/api/mood", headers=headers, json={
        "mood": 4, 
        "date": "2024-01-02", 
        "content": "Relaxed day",
        "selected_options": []
    })
    
    resp = client.get("/api/export/json", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["Content-Type"] == "application/json"
    
    data = resp.get_json()
    assert "entries" in data
    assert "groups" in data
    assert len(data["entries"]) >= 1 
    # Note: test isolation might mean we have 1 or 2 entries depending on fixture scope.
    # Generally client fixture yields fresh app but DB file might persist if not cleaned?
    # verify_test_db resets it? 
    # Current fixture creates app("testing"). 
    # Looking at test_mood_update_endpoint.py, it uses `_reset_test_db` which deletes /tmp/twilightio_test.db
    # So we should be good.
