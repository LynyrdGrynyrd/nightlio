"""Tests for SQLite concurrency: WAL mode, write serialization, and concurrent access."""

import threading

import pytest


def test_wal_mode_enabled(initialized_db):
    """WAL journal mode should be active on every connection."""
    with initialized_db._conn() as conn:
        row = conn.execute("PRAGMA journal_mode").fetchone()
        assert row[0].lower() == "wal"


def test_concurrent_mood_entries(db_with_user):
    """Multiple threads inserting mood entries should never conflict."""
    db, user_id = db_with_user
    errors: list = []
    entry_ids: list = []
    lock = threading.Lock()

    def create_entries(thread_id: int) -> None:
        try:
            for i in range(10):
                eid = db.add_mood_entry(
                    user_id=user_id,
                    date=f"2026-{thread_id + 1:02d}-{i + 1:02d}",
                    mood=(i % 5) + 1,
                    content=f"Thread {thread_id} entry {i}",
                )
                with lock:
                    entry_ids.append(eid)
        except Exception as exc:
            with lock:
                errors.append(exc)

    threads = [threading.Thread(target=create_entries, args=(t,)) for t in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == [], f"Errors during concurrent writes: {errors}"
    assert len(entry_ids) == 50
    assert len(set(entry_ids)) == 50, "Duplicate entry IDs detected"


def test_concurrent_goal_progress(db_with_user):
    """Concurrent goal increments should not lose updates or raise lock errors."""
    db, user_id = db_with_user
    goal_id = db.create_goal(
        user_id, "Concurrent Goal", "", frequency_per_week=7, frequency_type="daily", target_count=100
    )
    errors: list = []

    def increment(thread_id: int) -> None:
        try:
            for _ in range(5):
                db.increment_goal_progress(user_id, goal_id)
        except Exception as exc:
            errors.append(exc)

    threads = [threading.Thread(target=increment, args=(t,)) for t in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == [], f"Errors during concurrent goal progress: {errors}"
    goal = db.get_goal_by_id(user_id, goal_id)
    assert goal is not None


def test_mixed_reads_and_writes(db_with_user):
    """Reads should not block or be blocked by concurrent writes under WAL."""
    db, user_id = db_with_user

    # Seed a few entries so reads have data
    for i in range(5):
        db.add_mood_entry(user_id=user_id, date=f"2026-01-{i + 1:02d}", mood=3, content=f"seed {i}")

    errors: list = []

    def writer() -> None:
        try:
            for i in range(10):
                db.add_mood_entry(
                    user_id=user_id,
                    date=f"2026-02-{i + 1:02d}",
                    mood=4,
                    content=f"write {i}",
                )
        except Exception as exc:
            errors.append(exc)

    def reader() -> None:
        try:
            for _ in range(20):
                db.get_all_mood_entries(user_id)
        except Exception as exc:
            errors.append(exc)

    threads = [
        threading.Thread(target=writer),
        threading.Thread(target=reader),
        threading.Thread(target=reader),
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == [], f"Errors during mixed read/write: {errors}"


def test_write_transaction_rollback_on_error(initialized_db):
    """_write_transaction should roll back all changes when an exception occurs."""
    db = initialized_db
    user_id = db.create_user("rollback_test", "rb@test.com", "Rollback Test")

    with pytest.raises(RuntimeError):
        with db._write_transaction() as conn:
            conn.execute(
                "INSERT INTO mood_entries (user_id, date, mood, content, word_count) VALUES (?, ?, ?, ?, ?)",
                (user_id, "2026-01-01", 3, "should be rolled back", 4),
            )
            raise RuntimeError("intentional failure")

    entries = db.get_all_mood_entries(user_id)
    assert len(entries) == 0, "Entry should have been rolled back"
