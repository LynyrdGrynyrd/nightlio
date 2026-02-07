import base64
import io
import json
import os
import time
import zipfile

import pytest

from api.app import create_app

TEST_DB_PATH = "/tmp/twilightio_test.db"


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
    resp = client.post("/api/auth/local/login")
    assert resp.status_code == 200
    token = resp.get_json().get("token")
    assert token
    return {"Authorization": f"Bearer {token}"}


def _wait_for_job(client, headers, job_id: str, timeout_s: float = 5.0):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        status_resp = client.get(f"/api/import/daylio/{job_id}", headers=headers)
        assert status_resp.status_code == 200
        payload = status_resp.get_json()
        if payload.get("status") in {"completed", "failed"}:
            return payload
        time.sleep(0.05)
    raise AssertionError("Import job did not finish before timeout")


def test_daylio_import_dry_run_and_duplicate_detection(client):
    headers = _auth_headers(client)

    daylio_payload = {
        "entries": [
            {
                "createdAt": "2026-01-10T08:30:00+00:00",
                "mood": 4,
                "note": "Morning walk",
            },
            {
                "createdAt": "2026-01-11T09:45:00+00:00",
                "mood": 5,
                "note": "Great day",
            },
        ]
    }

    # Dry run import
    dry_run_resp = client.post(
        "/api/import/daylio?dry_run=true",
        headers=headers,
        data={
            "file": (io.BytesIO(json.dumps(daylio_payload).encode("utf-8")), "backup.daylio")
        },
        content_type="multipart/form-data",
    )
    assert dry_run_resp.status_code == 202
    dry_run_job_id = dry_run_resp.get_json()["job_id"]
    dry_run_job = _wait_for_job(client, headers, dry_run_job_id)
    assert dry_run_job["status"] == "completed"
    assert dry_run_job["dry_run"] is True
    assert dry_run_job["stats"]["total_entries"] == 2
    assert dry_run_job["stats"]["imported_entries"] == 2

    dry_entries_resp = client.get("/api/moods", headers=headers)
    assert dry_entries_resp.status_code == 200
    assert len(dry_entries_resp.get_json() or []) == 0

    # Real import
    real_resp = client.post(
        "/api/import/daylio",
        headers=headers,
        data={
            "file": (io.BytesIO(json.dumps(daylio_payload).encode("utf-8")), "backup.daylio")
        },
        content_type="multipart/form-data",
    )
    assert real_resp.status_code == 202
    real_job_id = real_resp.get_json()["job_id"]
    real_job = _wait_for_job(client, headers, real_job_id)
    assert real_job["status"] == "completed"
    assert real_job["stats"]["imported_entries"] == 2
    real_entries_resp = client.get("/api/moods", headers=headers)
    assert real_entries_resp.status_code == 200
    assert len(real_entries_resp.get_json() or []) == 2

    # Duplicate import should skip existing rows
    duplicate_resp = client.post(
        "/api/import/daylio",
        headers=headers,
        data={
            "file": (io.BytesIO(json.dumps(daylio_payload).encode("utf-8")), "backup.daylio")
        },
        content_type="multipart/form-data",
    )
    assert duplicate_resp.status_code == 202
    duplicate_job_id = duplicate_resp.get_json()["job_id"]
    duplicate_job = _wait_for_job(client, headers, duplicate_job_id)
    assert duplicate_job["status"] == "completed"
    assert duplicate_job["stats"]["skipped_duplicates"] == 2
    assert duplicate_job["stats"]["imported_entries"] == 0


def test_daylio_zip_base64_import_maps_activities(client):
    headers = _auth_headers(client)

    daylio_payload = {
        "entries": [
            {
                "createdAt": "2026-01-12T07:15:00+00:00",
                "mood": 0,
                "note": "Imported from zipped backup",
                "activityIds": ["act-run", "act-family"],
            }
        ],
        "activities": [
            {"id": "act-run", "name": "Running", "group": "Health", "icon": "run"},
            {"id": "act-family", "name": "Family", "group": "Social", "icon": "heart"},
        ],
    }

    encoded_payload = base64.b64encode(json.dumps(daylio_payload).encode("utf-8")).decode(
        "ascii"
    )

    zipped = io.BytesIO()
    with zipfile.ZipFile(zipped, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("backup.daylio", encoded_payload)
    zipped.seek(0)

    import_resp = client.post(
        "/api/import/daylio",
        headers=headers,
        data={"file": (io.BytesIO(zipped.getvalue()), "backup-export.zip")},
        content_type="multipart/form-data",
    )
    assert import_resp.status_code == 202

    job_id = import_resp.get_json()["job_id"]
    job = _wait_for_job(client, headers, job_id)
    assert job["status"] == "completed"
    assert job["stats"]["imported_entries"] == 1
    assert job["stats"]["failed_entries"] == 0

    moods_resp = client.get("/api/moods", headers=headers)
    assert moods_resp.status_code == 200
    moods = moods_resp.get_json() or []
    assert len(moods) == 1
    assert moods[0]["mood"] == 1  # imported 0-based mood should normalize to 1-5
    assert moods[0]["content"] == "Imported from zipped backup"

    groups_resp = client.get("/api/groups", headers=headers)
    assert groups_resp.status_code == 200
    groups = groups_resp.get_json() or []
    option_names = {
        str(option.get("name"))
        for group in groups
        for option in (group.get("options") or [])
        if option.get("name")
    }
    assert {"Running", "Family"}.issubset(option_names)
