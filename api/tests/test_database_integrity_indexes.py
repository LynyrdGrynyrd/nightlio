import sqlite3

import pytest

from api.database import MoodDatabase


def _create_minimal_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE mood_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE entry_selections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            option_id INTEGER NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE scale_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            scale_id INTEGER NOT NULL,
            value INTEGER
        )
        """
    )
    conn.commit()


def test_dedupe_backfill_and_unique_indexes(tmp_path):
    db_path = tmp_path / "integrity.db"

    with sqlite3.connect(db_path) as conn:
        _create_minimal_schema(conn)
        conn.execute("INSERT INTO users (username) VALUES ('alice')")
        conn.execute("INSERT INTO mood_entries (user_id, date) VALUES (1, '2026-02-07')")

        # Duplicate rows for the same logical pair.
        conn.execute(
            "INSERT INTO entry_selections (entry_id, option_id) VALUES (1, 10)"
        )
        conn.execute(
            "INSERT INTO entry_selections (entry_id, option_id) VALUES (1, 10)"
        )
        conn.execute(
            "INSERT INTO scale_entries (entry_id, scale_id, value) VALUES (1, 7, 3)"
        )
        conn.execute(
            "INSERT INTO scale_entries (entry_id, scale_id, value) VALUES (1, 7, 5)"
        )
        conn.commit()

    db = MoodDatabase(str(db_path), init=False)
    with sqlite3.connect(db_path) as conn:
        db._create_database_indexes(conn)  # exercise startup migration path
        conn.commit()

        selections = conn.execute(
            "SELECT id, option_id FROM entry_selections WHERE entry_id = 1 ORDER BY id"
        ).fetchall()
        scales = conn.execute(
            "SELECT id, scale_id, value FROM scale_entries WHERE entry_id = 1 ORDER BY id"
        ).fetchall()

        # Keeps oldest entry_selections row and latest scale_entries row.
        assert selections == [(1, 10)]
        assert scales == [(2, 7, 5)]

        # Unique index now blocks duplicates.
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute(
                "INSERT INTO entry_selections (entry_id, option_id) VALUES (1, 10)"
            )

        with pytest.raises(sqlite3.IntegrityError):
            conn.execute(
                "INSERT INTO scale_entries (entry_id, scale_id, value) VALUES (1, 7, 4)"
            )
