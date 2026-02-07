"""Database mixin for custom scale tracking (Sleep, Energy, Stress, etc.)."""

from __future__ import annotations

import sqlite3
from typing import Dict, List, Optional

try:
    from .database_common import DatabaseConnectionMixin
except ImportError:
    from database_common import DatabaseConnectionMixin


# Default scales for new users
DEFAULT_SCALES = [
    {"name": "Sleep Quality", "min_label": "Terrible", "max_label": "Perfect", "color_hex": "#6366f1"},
    {"name": "Energy Level", "min_label": "Exhausted", "max_label": "Energized", "color_hex": "#22c55e"},
    {"name": "Stress Level", "min_label": "Calm", "max_label": "Overwhelmed", "color_hex": "#ef4444"},
]


class ScalesMixin(DatabaseConnectionMixin):
    """CRUD helpers for custom scale definitions and entries."""

    def get_user_scales(self, user_id: int) -> List[Dict]:
        """Get all scale definitions for a user. Creates defaults if none exist."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT id, user_id, name, min_value, max_value, min_label, max_label, color_hex, is_active, created_at
                FROM scale_definitions
                WHERE user_id = ? AND is_active = 1
                ORDER BY id
                """,
                (user_id,),
            )
            rows = [dict(row) for row in cursor.fetchall()]

            # If no scales exist, create defaults
            if not rows:
                self._create_default_scales(user_id)
                cursor = conn.execute(
                    """
                    SELECT id, user_id, name, min_value, max_value, min_label, max_label, color_hex, is_active, created_at
                    FROM scale_definitions
                    WHERE user_id = ? AND is_active = 1
                    ORDER BY id
                    """,
                    (user_id,),
                )
                rows = [dict(row) for row in cursor.fetchall()]

            return rows

    def _create_default_scales(self, user_id: int) -> None:
        """Create default scales for a new user."""
        with self._connect() as conn:
            for scale in DEFAULT_SCALES:
                conn.execute(
                    """
                    INSERT INTO scale_definitions (user_id, name, min_label, max_label, color_hex, is_active)
                    VALUES (?, ?, ?, ?, ?, 1)
                    """,
                    (user_id, scale["name"], scale["min_label"], scale["max_label"], scale["color_hex"]),
                )
            conn.commit()

    def create_scale(
        self,
        user_id: int,
        name: str,
        min_label: Optional[str] = None,
        max_label: Optional[str] = None,
        color_hex: Optional[str] = None,
    ) -> int:
        """Create a new scale definition."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO scale_definitions (user_id, name, min_label, max_label, color_hex, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
                """,
                (user_id, name, min_label, max_label, color_hex),
            )
            conn.commit()
            return cursor.lastrowid or 0

    # Whitelist of columns allowed for dynamic UPDATE in scale definitions
    _SCALE_UPDATE_COLUMNS = frozenset({"name", "min_label", "max_label", "color_hex", "is_active"})

    def update_scale(
        self,
        user_id: int,
        scale_id: int,
        name: Optional[str] = None,
        min_label: Optional[str] = None,
        max_label: Optional[str] = None,
        color_hex: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Dict]:
        """Update a scale definition."""
        # Build updates from whitelisted columns only
        field_values = {
            "name": name,
            "min_label": min_label,
            "max_label": max_label,
            "color_hex": color_hex,
            "is_active": (1 if is_active else 0) if is_active is not None else None,
        }

        updates = []
        params = []
        for col, val in field_values.items():
            if val is not None and col in self._SCALE_UPDATE_COLUMNS:
                updates.append(f"{col} = ?")
                params.append(val)

        if not updates:
            return None

        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            params.extend([scale_id, user_id])
            # Column names are from hardcoded whitelist, safe for query
            query = f"UPDATE scale_definitions SET {', '.join(updates)} WHERE id = ? AND user_id = ?"
            conn.execute(query, params)
            conn.commit()

            cursor = conn.execute(
                "SELECT id, user_id, name, min_value, max_value, min_label, max_label, color_hex, is_active FROM scale_definitions WHERE id = ? AND user_id = ?",
                (scale_id, user_id),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def delete_scale(self, user_id: int, scale_id: int) -> bool:
        """Soft delete a scale (set is_active = 0)."""
        with self._connect() as conn:
            cursor = conn.execute(
                "UPDATE scale_definitions SET is_active = 0 WHERE id = ? AND user_id = ?",
                (scale_id, user_id),
            )
            conn.commit()
            return cursor.rowcount > 0

    def save_scale_entries(self, entry_id: int, scale_values: Dict[int, int]) -> None:
        """Save scale values for a mood entry. scale_values is {scale_id: value}."""
        with self._connect() as conn:
            # Delete existing entries for this mood entry
            conn.execute("DELETE FROM scale_entries WHERE entry_id = ?", (entry_id,))
            
            # Insert new values
            for scale_id, value in scale_values.items():
                conn.execute(
                    "INSERT INTO scale_entries (entry_id, scale_id, value) VALUES (?, ?, ?)",
                    (entry_id, scale_id, value),
                )
            conn.commit()

    def get_scale_entries_for_mood(self, entry_id: int) -> List[Dict]:
        """Get all scale entries for a mood entry."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT se.id, se.entry_id, se.scale_id, se.value, sd.name, sd.color_hex
                FROM scale_entries se
                JOIN scale_definitions sd ON se.scale_id = sd.id
                WHERE se.entry_id = ?
                """,
                (entry_id,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_user_scale_entries(self, user_id: int, start_date: str = None, end_date: str = None) -> List[Dict]:
        """Get all scale entries for a user, optionally filtered by date range."""
        query = """
            SELECT se.id, se.entry_id, se.scale_id, se.value, sd.name, sd.color_hex, me.date
            FROM scale_entries se
            JOIN scale_definitions sd ON se.scale_id = sd.id
            JOIN mood_entries me ON se.entry_id = me.id
            WHERE sd.user_id = ?
        """
        params = [user_id]

        if start_date:
            query += " AND me.date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND me.date <= ?"
            params.append(end_date)

        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_scale_entries_for_entries(self, entry_ids: List[int]) -> Dict[int, List[Dict]]:
        """Fetch scale entries for multiple mood entries in one query."""
        if not entry_ids:
            return {}

        placeholders = ",".join("?" * len(entry_ids))
        query = f"""
            SELECT se.id, se.entry_id, se.scale_id, se.value,
                   sd.name, sd.color_hex, sd.min_value, sd.max_value, sd.min_label, sd.max_label
            FROM scale_entries se
            JOIN scale_definitions sd ON se.scale_id = sd.id
            WHERE se.entry_id IN ({placeholders})
        """

        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(query, entry_ids)
            rows = cursor.fetchall()

        result: Dict[int, List[Dict]] = {}
        for row in rows:
            entry_id = row["entry_id"]
            if entry_id not in result:
                result[entry_id] = []
            result[entry_id].append(dict(row))

        return result

    def get_scale_averages(self, user_id: int, days: int = 30) -> List[Dict]:
        """Get average values for each scale over the past N days."""
        query = """
            SELECT sd.id as scale_id, sd.name, sd.color_hex, sd.min_value, sd.max_value,
                   AVG(se.value) as avg_value, COUNT(se.id) as count
            FROM scale_definitions sd
            LEFT JOIN scale_entries se ON sd.id = se.scale_id
            LEFT JOIN mood_entries me ON se.entry_id = me.id
                AND me.date >= date('now', '-' || ? || ' days')
            WHERE sd.user_id = ? AND sd.is_active = 1
            GROUP BY sd.id
        """

        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(query, (days, user_id))
            return [dict(row) for row in cursor.fetchall()]


__all__ = ["ScalesMixin"]
