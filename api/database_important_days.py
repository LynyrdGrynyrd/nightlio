"""Important Days database operations."""

from __future__ import annotations

import sqlite3
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional

try:
    from .database_common import DatabaseConnectionMixin, logger
except ImportError:
    from database_common import DatabaseConnectionMixin, logger  # type: ignore


class ImportantDaysMixin(DatabaseConnectionMixin):
    """Provides CRUD operations for important days / countdowns."""

    def create_important_day(
        self,
        user_id: int,
        title: str,
        target_date: str,
        category: str = "Custom",
        icon: str = "calendar",
        recurring_type: str = "once",
        remind_days_before: int = 1,
        notes: Optional[str] = None,
    ) -> int:
        """Create a new important day."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO important_days 
                (user_id, title, date, category, icon, recurring_type, remind_days_before, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, title, target_date, category, icon, recurring_type, remind_days_before, notes),
            )
            conn.commit()
            return cursor.lastrowid or 0

    def get_important_days(self, user_id: int) -> List[Dict]:
        """Get all important days for a user with calculated countdowns."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT id, title, date, category, icon, recurring_type, 
                       remind_days_before, notes, is_active, created_at
                FROM important_days
                WHERE user_id = ? AND is_active = 1
                ORDER BY date ASC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                item = dict(row)
                countdown = self._calculate_countdown(item["date"], item["recurring_type"])
                item.update(countdown)
                result.append(item)
            
            # Sort by days_until (upcoming first)
            result.sort(key=lambda x: x.get("days_until", 9999))
            return result

    def get_important_day_by_id(self, user_id: int, day_id: int) -> Optional[Dict]:
        """Get a specific important day by ID."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT id, title, date, category, icon, recurring_type,
                       remind_days_before, notes, is_active, created_at
                FROM important_days
                WHERE id = ? AND user_id = ?
                """,
                (day_id, user_id),
            )
            row = cursor.fetchone()
            if row:
                item = dict(row)
                countdown = self._calculate_countdown(item["date"], item["recurring_type"])
                item.update(countdown)
                return item
            return None

    def update_important_day(
        self,
        user_id: int,
        day_id: int,
        title: Optional[str] = None,
        target_date: Optional[str] = None,
        category: Optional[str] = None,
        icon: Optional[str] = None,
        recurring_type: Optional[str] = None,
        remind_days_before: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> bool:
        """Update an important day."""
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = ?")
            params.append(title)
        if target_date is not None:
            updates.append("date = ?")
            params.append(target_date)
        if category is not None:
            updates.append("category = ?")
            params.append(category)
        if icon is not None:
            updates.append("icon = ?")
            params.append(icon)
        if recurring_type is not None:
            updates.append("recurring_type = ?")
            params.append(recurring_type)
        if remind_days_before is not None:
            updates.append("remind_days_before = ?")
            params.append(remind_days_before)
        if notes is not None:
            updates.append("notes = ?")
            params.append(notes)
        
        if not updates:
            return False
        
        params.extend([day_id, user_id])
        
        with self._connect() as conn:
            cursor = conn.execute(
                f"UPDATE important_days SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
                params,
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_important_day(self, user_id: int, day_id: int) -> bool:
        """Delete an important day."""
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM important_days WHERE id = ? AND user_id = ?",
                (day_id, user_id),
            )
            conn.commit()
            return cursor.rowcount > 0

    def get_upcoming_important_days(self, user_id: int, days_ahead: int = 30) -> List[Dict]:
        """Get important days occurring in the next N days."""
        all_days = self.get_important_days(user_id)
        return [d for d in all_days if 0 <= d.get("days_until", 9999) <= days_ahead]

    def _calculate_countdown(self, target_date: str, recurring_type: str) -> Dict:
        """Calculate countdown information for an important day."""
        try:
            target = datetime.strptime(target_date, "%Y-%m-%d").date()
            today = date.today()

            if recurring_type == "yearly":
                # Get this year's occurrence
                this_year = target.replace(year=today.year)
                if this_year < today:
                    # Already passed, get next year
                    this_year = target.replace(year=today.year + 1)
                target = this_year
            elif recurring_type == "monthly":
                # Get this month's occurrence
                try:
                    this_month = target.replace(year=today.year, month=today.month)
                except ValueError:
                    # Day doesn't exist in this month (e.g., Feb 30)
                    this_month = target.replace(year=today.year, month=today.month + 1, day=1) - timedelta(days=1)
                if this_month < today:
                    # Already passed, get next month
                    next_month = today.month + 1 if today.month < 12 else 1
                    next_year = today.year if today.month < 12 else today.year + 1
                    try:
                        this_month = target.replace(year=next_year, month=next_month)
                    except ValueError:
                        this_month = date(next_year, next_month + 1, 1) - timedelta(days=1)
                target = this_month

            delta = (target - today).days

            if delta == 0:
                display_text = "Today!"
            elif delta == 1:
                display_text = "Tomorrow"
            elif delta > 0:
                display_text = f"in {delta} days"
            else:
                display_text = f"{abs(delta)} days ago"

            return {
                "days_until": delta,
                "is_today": delta == 0,
                "is_past": delta < 0,
                "display_text": display_text,
                "next_occurrence": target.strftime("%Y-%m-%d"),
            }
        except Exception as exc:
            logger.warning("Error calculating countdown: %s", exc)
            return {
                "days_until": 9999,
                "is_today": False,
                "is_past": False,
                "display_text": "Unknown",
                "next_occurrence": target_date,
            }


__all__ = ["ImportantDaysMixin"]
