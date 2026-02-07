"""Media attachment management mixin."""

from __future__ import annotations

import sqlite3
from typing import Dict, List, Optional

try:  # pragma: no cover
    from .database_common import DatabaseConnectionMixin
except ImportError:  # pragma: no cover
    from database_common import DatabaseConnectionMixin  # type: ignore

class MediaMixin(DatabaseConnectionMixin):
    """CRUD helpers for media attachments."""

    def add_media_attachment(
        self,
        entry_id: int,
        file_path: str,
        file_type: str,
        thumbnail_path: Optional[str] = None
    ) -> int:
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO media_attachments (entry_id, file_path, file_type, thumbnail_path)
                VALUES (?, ?, ?, ?)
                """,
                (entry_id, file_path, file_type, thumbnail_path),
            )
            conn.commit()
            return int(cursor.lastrowid if cursor.lastrowid is not None else 0)

    def get_media_for_entry(self, entry_id: int) -> List[Dict]:
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT id, entry_id, file_path, file_type, thumbnail_path, created_at FROM media_attachments WHERE entry_id = ?",
                (entry_id,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_media_by_id(self, media_id: int) -> Optional[Dict]:
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT id, entry_id, file_path, file_type, created_at FROM media_attachments WHERE id = ?",
                (media_id,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_media_by_filename(self, filename: str) -> Optional[Dict]:
        """Get media record by file_path (filename) for ownership verification."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT id, entry_id, file_path, file_type, created_at FROM media_attachments WHERE file_path = ?",
                (filename,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def delete_media_attachment(self, media_id: int) -> bool:
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM media_attachments WHERE id = ?",
                (media_id,),
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_all_media_for_entry(self, entry_id: int) -> List[str]:
        """Deletes all media records for an entry and returns the file paths for deletion from disk."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT file_path FROM media_attachments WHERE entry_id = ?",
                (entry_id,),
            )
            file_paths = [row["file_path"] for row in cursor.fetchall()]
            conn.execute(
                "DELETE FROM media_attachments WHERE entry_id = ?",
                (entry_id,),
            )
            conn.commit()
            return file_paths

    def get_media_for_entries(self, entry_ids: List[int]) -> Dict[int, List[Dict]]:
        """Fetch media for multiple entries in one query."""
        if not entry_ids:
            return {}

        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            placeholders = ','.join('?' for _ in entry_ids)
            cursor = conn.execute(
                f"""
                SELECT id, entry_id, file_path, file_type, thumbnail_path, created_at
                  FROM media_attachments
                 WHERE entry_id IN ({placeholders})
                 ORDER BY entry_id, created_at DESC
                """,
                entry_ids,
            )

            result: Dict[int, List[Dict]] = {eid: [] for eid in entry_ids}
            for row in cursor.fetchall():
                result[row['entry_id']].append(dict(row))
            return result

    def get_all_media_for_user(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        start_date: str = None,
        end_date: str = None,
    ) -> Dict:
        """Get all media across entries for a user with pagination."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            
            # Build query with optional date filters
            query = """
                SELECT m.id, m.entry_id, m.file_path, m.file_type, m.thumbnail_path, m.created_at,
                       e.date as entry_date, e.mood as entry_mood
                FROM media_attachments m
                JOIN mood_entries e ON m.entry_id = e.id
                WHERE e.user_id = ?
            """
            params = [user_id]
            
            if start_date:
                query += " AND e.date >= ?"
                params.append(start_date)
            if end_date:
                query += " AND e.date <= ?"
                params.append(end_date)
            
            # Count total
            count_query = query.replace(
                "SELECT m.id, m.entry_id, m.file_path, m.file_type, m.thumbnail_path, m.created_at,\n                       e.date as entry_date, e.mood as entry_mood",
                "SELECT COUNT(*)"
            )
            total = conn.execute(count_query, params).fetchone()[0]
            
            # Add ordering and pagination
            query += " ORDER BY e.date DESC, m.created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor = conn.execute(query, params)
            photos = []
            for row in cursor.fetchall():
                photos.append({
                    "id": row["id"],
                    "entry_id": row["entry_id"],
                    "file_path": row["file_path"],
                    "file_type": row["file_type"],
                    "thumbnail_path": row["thumbnail_path"],
                    "entry_date": row["entry_date"],
                    "entry_mood": row["entry_mood"],
                })
            
            return {
                "photos": photos,
                "total": total,
                "has_more": offset + len(photos) < total,
            }
