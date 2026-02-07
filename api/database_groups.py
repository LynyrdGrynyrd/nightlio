"""Group and selection helpers."""

from __future__ import annotations

import sqlite3
from typing import Dict, List, Optional

try:  # pragma: no cover - enable script execution fallback
    from .database_common import DatabaseConnectionMixin
except ImportError:  # pragma: no cover
    from database_common import DatabaseConnectionMixin  # type: ignore


class GroupsMixin(DatabaseConnectionMixin):
    """Provides CRUD helpers for groups and group options."""

    def get_all_groups(self) -> List[Dict]:
        """Get all groups with their options in a single query (no N+1)."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            # Single JOIN query to get groups and options together
            cursor = conn.execute(
                """
                SELECT g.id as group_id, g.name as group_name, g.user_id,
                       go.id as option_id, go.name as option_name, go.icon
                FROM groups g
                LEFT JOIN group_options go ON g.id = go.group_id
                ORDER BY g.name, go.name
                """
            )
            return self._aggregate_groups_from_rows(cursor.fetchall())

    def get_groups_for_user(self, user_id: int) -> List[Dict]:
        """Get groups for a specific user with options in a single query (no N+1)."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            # Single JOIN query to get groups and options together
            cursor = conn.execute(
                """
                SELECT g.id as group_id, g.name as group_name, g.user_id,
                       go.id as option_id, go.name as option_name, go.icon
                FROM groups g
                LEFT JOIN group_options go ON g.id = go.group_id
                WHERE g.user_id = ? OR g.user_id IS NULL
                ORDER BY g.name, go.name
                """,
                (user_id,),
            )
            return self._aggregate_groups_from_rows(cursor.fetchall())

    def _aggregate_groups_from_rows(self, rows: List[sqlite3.Row]) -> List[Dict]:
        """Aggregate flat JOIN rows into nested group/options structure."""
        groups_dict: Dict[int, Dict] = {}

        for row in rows:
            group_id = row["group_id"]

            if group_id not in groups_dict:
                groups_dict[group_id] = {
                    "id": group_id,
                    "name": row["group_name"],
                    "user_id": row["user_id"],
                    "options": [],
                }

            # Only add option if it exists (LEFT JOIN may return NULL)
            if row["option_id"] is not None:
                groups_dict[group_id]["options"].append({
                    "id": row["option_id"],
                    "name": row["option_name"],
                    "icon": row["icon"],
                })

        return list(groups_dict.values())

    def create_group(self, name: str) -> int:
        """Create a global group (no user_id)."""
        with self._connect() as conn:
            cursor = conn.execute("INSERT INTO groups (name) VALUES (?)", (name,))
            conn.commit()
            return int(cursor.lastrowid or 0)

    def create_group_for_user(self, user_id: int, name: str) -> int:
        """Create a group for a specific user."""
        with self._connect() as conn:
            cursor = conn.execute(
                "INSERT INTO groups (name, user_id) VALUES (?, ?)",
                (name, user_id),
            )
            conn.commit()
            return int(cursor.lastrowid or 0)

    def verify_group_ownership(self, group_id: int, user_id: int) -> bool:
        """Verify that a group belongs to a user (or is a global group)."""
        with self._connect() as conn:
            cursor = conn.execute(
                "SELECT 1 FROM groups WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
                (group_id, user_id),
            )
            return cursor.fetchone() is not None

    def verify_option_ownership(self, option_id: int, user_id: int) -> bool:
        """Verify that an option belongs to a user's group (or a global group)."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                SELECT 1 FROM group_options go
                JOIN groups g ON go.group_id = g.id
                WHERE go.id = ? AND (g.user_id = ? OR g.user_id IS NULL)
                """,
                (option_id, user_id),
            )
            return cursor.fetchone() is not None

    def group_exists(self, group_id: int) -> bool:
        """Check if a group exists."""
        with self._connect() as conn:
            cursor = conn.execute("SELECT 1 FROM groups WHERE id = ?", (group_id,))
            return cursor.fetchone() is not None

    def option_exists(self, option_id: int) -> bool:
        """Check if an option exists."""
        with self._connect() as conn:
            cursor = conn.execute("SELECT 1 FROM group_options WHERE id = ?", (option_id,))
            return cursor.fetchone() is not None

    def create_group_option(self, group_id: int, name: str, icon: str = None) -> int:
        with self._connect() as conn:
            cursor = conn.execute(
                "INSERT INTO group_options (group_id, name, icon) VALUES (?, ?, ?)",
                (group_id, name, icon),
            )
            conn.commit()
            return int(cursor.lastrowid or 0)

    def delete_group(self, group_id: int) -> bool:
        with self._connect() as conn:
            cursor = conn.execute("DELETE FROM groups WHERE id = ?", (group_id,))
            conn.commit()
            return cursor.rowcount > 0

    def delete_group_option(self, option_id: int) -> bool:
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM group_options WHERE id = ?",
                (option_id,),
            )
            conn.commit()
            return cursor.rowcount > 0

    def update_option_group(self, option_id: int, new_group_id: int) -> bool:
        with self._connect() as conn:
            cursor = conn.execute(
                "UPDATE group_options SET group_id = ? WHERE id = ?",
                (new_group_id, option_id),
            )
            conn.commit()
            return cursor.rowcount > 0

    def add_entry_selections(self, entry_id: int, option_ids: List[int]) -> None:
        with self._connect() as conn:
            conn.executemany(
                "INSERT INTO entry_selections (entry_id, option_id) VALUES (?, ?)",
                [(entry_id, option_id) for option_id in option_ids],
            )
            conn.commit()

    def get_entry_selections(self, entry_id: int) -> List[Dict]:
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT go.id, go.name, go.icon, g.name as group_name
                  FROM entry_selections es
                  JOIN group_options go ON es.option_id = go.id
                  JOIN groups g ON go.group_id = g.id
                 WHERE es.entry_id = ?
                 ORDER BY g.name, go.name
                """,
                (entry_id,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_selections_for_entries(self, entry_ids: List[int]) -> Dict[int, List[Dict]]:
        """Fetch selections for multiple entries in one query."""
        if not entry_ids:
            return {}

        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            placeholders = ','.join('?' for _ in entry_ids)
            cursor = conn.execute(
                f"""
                SELECT es.entry_id, go.id, go.name, go.icon, g.name as group_name
                  FROM entry_selections es
                  JOIN group_options go ON es.option_id = go.id
                  JOIN groups g ON go.group_id = g.id
                 WHERE es.entry_id IN ({placeholders})
                 ORDER BY es.entry_id, g.name, go.name
                """,
                entry_ids,
            )

            result: Dict[int, List[Dict]] = {eid: [] for eid in entry_ids}
            for row in cursor.fetchall():
                result[row['entry_id']].append({
                    'id': row['id'],
                    'name': row['name'],
                    'icon': row['icon'],
                    'group_name': row['group_name']
                })
            return result


__all__ = ["GroupsMixin"]
