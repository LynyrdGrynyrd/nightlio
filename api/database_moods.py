"""Mood entry management mixin."""

from __future__ import annotations

import re
import sqlite3
from typing import Dict, List, Optional

from api.database_common import DatabaseConnectionMixin, logger


def compute_word_count(content: str) -> int:
    """Strip markdown syntax and count words."""
    text = re.sub(r"[#*_\[\]()!|>~`\-]+", " ", content)
    text = re.sub(r"https?://\S+", "", text)
    words = text.split()
    return len([w for w in words if len(w) > 0])


# Default mood definitions for new users
DEFAULT_MOODS = [
    {"score": 1, "label": "Terrible", "icon": "😢", "color_hex": "#ef4444"},
    {"score": 2, "label": "Bad", "icon": "😕", "color_hex": "#f97316"},
    {"score": 3, "label": "Okay", "icon": "😐", "color_hex": "#eab308"},
    {"score": 4, "label": "Good", "icon": "🙂", "color_hex": "#22c55e"},
    {"score": 5, "label": "Amazing", "icon": "😄", "color_hex": "#10b981"},
]


class MoodDefinitionMixin(DatabaseConnectionMixin):
    """CRUD helpers for custom mood definitions."""

    # Whitelist of columns allowed for dynamic UPDATE in mood definitions
    _MOOD_DEF_UPDATE_COLUMNS = frozenset({"label", "icon", "color_hex"})

    def get_user_mood_definitions(self, user_id: int) -> List[Dict]:
        """Get mood definitions for a user. Creates defaults if none exist."""
        with self._conn() as conn:
            cursor = conn.execute(
                "SELECT id, user_id, score, label, icon, color_hex, is_active FROM mood_definitions WHERE user_id = ? ORDER BY score",
                (user_id,),
            )
            rows = [dict(row) for row in cursor.fetchall()]

            # If no definitions exist, create defaults
            if not rows:
                self._create_default_moods(user_id)
                cursor = conn.execute(
                    "SELECT id, user_id, score, label, icon, color_hex, is_active FROM mood_definitions WHERE user_id = ? ORDER BY score",
                    (user_id,),
                )
                rows = [dict(row) for row in cursor.fetchall()]

            return rows

    def _create_default_moods(self, user_id: int) -> None:
        """Create default mood definitions for a new user."""
        with self._write_transaction() as conn:
            for mood in DEFAULT_MOODS:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO mood_definitions (user_id, score, label, icon, color_hex, is_active)
                    VALUES (?, ?, ?, ?, ?, 1)
                    """,
                    (user_id, mood["score"], mood["label"], mood["icon"], mood["color_hex"]),
                )

    def update_mood_definition(
        self,
        user_id: int,
        score: int,
        label: Optional[str] = None,
        icon: Optional[str] = None,
        color_hex: Optional[str] = None,
    ) -> Optional[Dict]:
        """Update a specific mood definition for a user."""
        # Ensure user has mood definitions
        self.get_user_mood_definitions(user_id)

        # Build updates from whitelisted columns only
        field_values = {
            "label": label,
            "icon": icon,
            "color_hex": color_hex,
        }

        updates = []
        params = []
        for col, val in field_values.items():
            if val is not None and col in self._MOOD_DEF_UPDATE_COLUMNS:
                updates.append(f"{col} = ?")
                params.append(val)

        if not updates:
            return None

        with self._write_transaction() as conn:
            params.extend([user_id, score])
            # Column names are from hardcoded whitelist, safe for query
            query = f"UPDATE mood_definitions SET {', '.join(updates)} WHERE user_id = ? AND score = ?"
            conn.execute(query, params)

            # Return updated row
            cursor = conn.execute(
                "SELECT id, user_id, score, label, icon, color_hex, is_active FROM mood_definitions WHERE user_id = ? AND score = ?",
                (user_id, score),
            )
            row = cursor.fetchone()
            return dict(row) if row else None


class MoodEntriesMixin(DatabaseConnectionMixin):
    """CRUD helpers for mood entries and their selections."""

    def verify_entry_ownership(self, entry_id: int, user_id: int) -> bool:
        """Check if a mood entry belongs to a specific user."""
        row = self._query(
            "SELECT 1 FROM mood_entries WHERE id = ? AND user_id = ?",
            (entry_id, user_id),
        ).fetchone()
        return row is not None

    def add_mood_entry(
        self,
        user_id: int,
        date: str,
        mood: int,
        content: str,
        time: Optional[str] = None,
        selected_options: Optional[List[int]] = None,
    ) -> int:
        wc = compute_word_count(content)
        with self._write_transaction() as conn:
            if time:
                cursor = conn.execute(
                    """
                    INSERT INTO mood_entries (user_id, date, mood, content, word_count, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, date, mood, content, wc, time),
                )
            else:
                cursor = conn.execute(
                    """
                    INSERT INTO mood_entries (user_id, date, mood, content, word_count)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (user_id, date, mood, content, wc),
                )

            entry_id = cursor.lastrowid

            if selected_options:
                conn.executemany(
                    "INSERT INTO entry_selections (entry_id, option_id) VALUES (?, ?)",
                    [(entry_id, option_id) for option_id in selected_options],
                )

            return int(entry_id if entry_id is not None else 0)

    def get_all_mood_entries(self, user_id: int) -> List[Dict]:
        cursor = self._query(
            """
            SELECT id, date, mood, content, created_at, updated_at
              FROM mood_entries
             WHERE user_id = ?
             ORDER BY created_at DESC, date DESC
            """,
            (user_id,),
        )
        return [dict(row) for row in cursor.fetchall()]

    def get_mood_entries_paginated(
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 20,
    ) -> Dict:
        """Get mood entries with pagination.

        Args:
            user_id: The user's ID
            page: Page number (1-indexed)
            per_page: Number of entries per page

        Returns:
            Dict with 'entries' list and 'total' count
        """
        offset = (page - 1) * per_page

        with self._conn() as conn:
            # Get total count
            count_cursor = conn.execute(
                "SELECT COUNT(*) as cnt FROM mood_entries WHERE user_id = ?",
                (user_id,),
            )
            total = count_cursor.fetchone()["cnt"]

            # Get paginated entries
            cursor = conn.execute(
                """
                SELECT id, date, mood, content, created_at, updated_at
                  FROM mood_entries
                 WHERE user_id = ?
                 ORDER BY created_at DESC, date DESC
                 LIMIT ? OFFSET ?
                """,
                (user_id, per_page, offset),
            )
            entries = [dict(row) for row in cursor.fetchall()]

            return {"entries": entries, "total": total}

    def get_mood_entries_by_date_range(
        self,
        user_id: int,
        start_date: str,
        end_date: str,
    ) -> List[Dict]:
        cursor = self._query(
            """
            SELECT id, date, mood, content, created_at, updated_at
              FROM mood_entries
             WHERE user_id = ? AND date BETWEEN ? AND ?
             ORDER BY created_at DESC, date DESC
            """,
            (user_id, start_date, end_date),
        )
        return [dict(row) for row in cursor.fetchall()]

    def get_mood_entry_by_id(self, user_id: int, entry_id: int) -> Optional[Dict]:
        row = self._query(
            """
            SELECT id, date, mood, content, created_at, updated_at
              FROM mood_entries
             WHERE id = ? AND user_id = ?
            """,
            (entry_id, user_id),
        ).fetchone()
        return dict(row) if row else None

    def update_mood_entry(
        self,
        user_id: int,
        entry_id: int,
        mood: Optional[int] = None,
        content: Optional[str] = None,
        date: Optional[str] = None,
        time: Optional[str] = None,
        selected_options: Optional[List[int]] = None,
    ) -> bool:
        updates: List[str] = []
        params: List[object] = []

        if mood is not None:
            updates.append("mood = ?")
            params.append(mood)
        if content is not None:
            updates.append("content = ?")
            params.append(content)
            updates.append("word_count = ?")
            params.append(compute_word_count(content))
        if date is not None:
            updates.append("date = ?")
            params.append(date)
        if time is not None:
            updates.append("created_at = ?")
            params.append(time)

        with self._write_transaction() as conn:
            row = conn.execute(
                "SELECT id FROM mood_entries WHERE id = ? AND user_id = ?",
                (entry_id, user_id),
            ).fetchone()
            if not row:
                return False

            updated = False
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                conn.execute(
                    f"UPDATE mood_entries SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
                    params + [entry_id, user_id],
                )
                updated = True
            else:
                conn.execute(
                    """
                    UPDATE mood_entries
                       SET updated_at = CURRENT_TIMESTAMP
                     WHERE id = ? AND user_id = ?
                    """,
                    (entry_id, user_id),
                )

            if selected_options is not None:
                conn.execute(
                    "DELETE FROM entry_selections WHERE entry_id = ?",
                    (entry_id,),
                )
                if selected_options:
                    conn.executemany(
                        "INSERT INTO entry_selections (entry_id, option_id) VALUES (?, ?)",
                        [(entry_id, option_id) for option_id in selected_options],
                    )
                updated = True

            return updated or bool(selected_options is not None)

    def delete_mood_entry(self, user_id: int, entry_id: int) -> bool:
        """Delete a mood entry for a user."""
        cursor = self._query(
            "DELETE FROM mood_entries WHERE id = ? AND user_id = ?",
            (entry_id, user_id),
            commit=True,
        )
        return cursor.rowcount > 0

    def search_mood_entries(
        self,
        user_id: int,
        query: str,
        moods: Optional[List[int]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Dict:
        """Search entries using FTS and filters with pagination.

        Args:
            user_id: The user's ID
            query: Full-text search query
            moods: Optional list of mood values to filter by
            start_date: Optional start date filter (YYYY-MM-DD)
            end_date: Optional end date filter (YYYY-MM-DD)
            page: Page number (1-indexed)
            per_page: Number of entries per page

        Returns:
            Dict with 'entries' list and 'total' count
        """
        base_sql = " FROM mood_entries m"
        params: List = []
        where_clauses = ["m.user_id = ?"]
        params.append(user_id)

        # FTS Join if query present
        if query:
            base_sql += " JOIN entries_fts f ON f.rowid = m.id "
            where_clauses.append("entries_fts MATCH ?")
            params.append(query)

        if moods:
            placeholders = ','.join('?' for _ in moods)
            where_clauses.append(f"m.mood IN ({placeholders})")
            params.extend(moods)

        if start_date:
            where_clauses.append("m.date >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("m.date <= ?")
            params.append(end_date)

        where_sql = " WHERE " + " AND ".join(where_clauses)
        offset = (page - 1) * per_page

        with self._conn() as conn:
            try:
                # Get total count
                count_sql = "SELECT COUNT(*)" + base_sql + where_sql
                count_cursor = conn.execute(count_sql, params)
                total = count_cursor.fetchone()[0]

                # Get paginated entries
                select_sql = (
                    "SELECT m.id, m.date, m.mood, m.content, m.created_at, m.updated_at"
                    + base_sql
                    + where_sql
                    + " ORDER BY m.date DESC, m.created_at DESC LIMIT ? OFFSET ?"
                )
                cursor = conn.execute(select_sql, params + [per_page, offset])
                entries = [dict(row) for row in cursor.fetchall()]

                return {"entries": entries, "total": total}
            except sqlite3.OperationalError as e:
                # FTS might fail on invalid syntax
                logger.warning(f"Search query failed: {e}")
                return {"entries": [], "total": 0}


__all__ = ["MoodEntriesMixin"]
