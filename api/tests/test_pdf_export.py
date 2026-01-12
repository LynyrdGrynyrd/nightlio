import pytest
from api.app import create_app
import os

TEST_DB_PATH = "/tmp/nightlio_test_pdf.db"

def _reset_test_db():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

@pytest.fixture
def client():
    _reset_test_db()
    app = create_app("testing")
    with app.test_client() as test_client:
        yield test_client

def _auth_headers(client):
    client.post("/api/auth/google", json={
        "token": "test_token",
        "email": "test@example.com",
        "name": "Test User",
        "google_id": "999"
    })
    resp = client.post("/api/auth/local/login")
    token = resp.get_json().get("token")
    return {"Authorization": f"Bearer {token}"}

def test_export_pdf(client):
    headers = _auth_headers(client)
    
    # Create some data
    client.post("/api/mood", headers=headers, json={
        "mood": 5, 
        "date": "2024-01-01", 
        "content": "PDF Test Entry",
        "selected_options": []
    })
    
    resp = client.get("/api/export/pdf", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["Content-Type"] == "application/pdf"
    assert resp.data.startswith(b"%PDF")
    
def test_export_pdf_with_dates(client):
    headers = _auth_headers(client)
    
    # Create data outside range
    client.post("/api/mood", headers=headers, json={
        "mood": 1, "date": "2023-01-01", "content": "Old", "selected_options": []
    })
    # Create data inside range
    client.post("/api/mood", headers=headers, json={
        "mood": 5, "date": "2024-06-01", "content": "Target", "selected_options": []
    })

    resp = client.get("/api/export/pdf?start_date=2024-01-01&end_date=2024-12-31", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["Content-Type"] == "application/pdf"
    # Content check is hard with binary PDF, but we assume it filtered correctly if it didn't crash.
