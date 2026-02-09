"""Goal management mixin for Twilightio."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, date
import json
from typing import Dict, List, Optional

from api.database_common import (
    DatabaseConnectionMixin,
    DatabaseError,
    SQLQueries,
    logger,
)


class GoalsMixin(DatabaseConnectionMixin):
    """Provides goal CRUD and progress helpers."""

    @staticmethod
    def _week_start_iso(date_obj: Optional[date] = None) -> str:
        if date_obj is None:
            date_obj = datetime.now().date()
        start = date_obj - timedelta(days=date_obj.weekday())
        return start.strftime("%Y-%m-%d")

    @staticmethod
    def _month_start_iso(date_obj: Optional[date] = None) -> str:
        if date_obj is None:
            date_obj = datetime.now().date()
        return date_obj.replace(day=1).strftime("%Y-%m-%d")

    @staticmethod
    def _day_start_iso(date_obj: Optional[date] = None) -> str:
        if date_obj is None:
            date_obj = datetime.now().date()
        return date_obj.strftime("%Y-%m-%d")

    def _get_period_start(self, frequency_type: str, date_obj: Optional[date] = None) -> str:
        """Get period start based on frequency type."""
        if frequency_type == "daily":
            return self._day_start_iso(date_obj)
        elif frequency_type == "monthly":
            return self._month_start_iso(date_obj)
        else:  # weekly/custom (default weekly cadence)
            return self._week_start_iso(date_obj)

    def _get_period_bounds(
        self, frequency_type: str, date_obj: date
    ) -> tuple[str, str]:
        """Get period start/end boundaries for a frequency type."""
        if frequency_type == "daily":
            iso = date_obj.strftime("%Y-%m-%d")
            return iso, iso

        if frequency_type == "monthly":
            month_start = date_obj.replace(day=1)
            if date_obj.month == 12:
                next_month = date_obj.replace(year=date_obj.year + 1, month=1, day=1)
            else:
                next_month = date_obj.replace(month=date_obj.month + 1, day=1)
            month_end = next_month - timedelta(days=1)
            return month_start.strftime("%Y-%m-%d"), month_end.strftime("%Y-%m-%d")

        # weekly/custom
        week_start = date_obj - timedelta(days=date_obj.weekday())
        week_end = week_start + timedelta(days=6)
        return week_start.strftime("%Y-%m-%d"), week_end.strftime("%Y-%m-%d")

    @staticmethod
    def _goal_target_total(goal: Dict) -> int:
        """Resolve the period target count for a goal across frequency modes."""
        frequency_type = (goal.get("frequency_type") or "weekly").lower()
        if frequency_type == "weekly":
            return int(goal.get("frequency_per_week") or 0)
        return int(goal.get("target_count") or goal.get("frequency_per_week") or 0)

    @staticmethod
    def _parse_custom_days(custom_days: Optional[str]) -> List[int]:
        if not custom_days:
            return []
        try:
            parsed = json.loads(custom_days)
        except (TypeError, ValueError):
            return []
        if not isinstance(parsed, list):
            return []
        return sorted(
            {
                int(day)
                for day in parsed
                if isinstance(day, int) and 0 <= int(day) <= 6
            }
        )

    def _is_custom_day_allowed(self, goal: Dict, target_date: date) -> bool:
        frequency_type = (goal.get("frequency_type") or "weekly").lower()
        if frequency_type != "custom":
            return True
        custom_days = self._parse_custom_days(goal.get("custom_days"))
        if not custom_days:
            return True
        return target_date.weekday() in custom_days

    def _rollover_goal_if_needed(
        self,
        conn: sqlite3.Connection,
        goal_row: sqlite3.Row,
        *,
        in_transaction: bool = False,
    ) -> Dict:
        """Roll over goal to new period if needed, with transaction locking.

        Args:
            conn: Active database connection.
            goal_row: The goal row to check.
            in_transaction: When ``True`` the caller already holds a write
                transaction (via ``_write_transaction``), so this method skips
                its own ``BEGIN IMMEDIATE`` / commit / rollback.
        """
        goal_dict = dict(goal_row)
        frequency_type = (goal_dict.get("frequency_type") or "weekly").lower()
        today_start = self._get_period_start(frequency_type)
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Quick check - if already current period, no rollover needed
        if (goal_dict.get("period_start") or "") == today_start:
            goal_dict["already_completed_today"] = (
                goal_dict.get("last_completed_date") == today_str
            )
            return goal_dict

        # Need rollover
        try:
            if not in_transaction:
                conn.execute("BEGIN IMMEDIATE")

            # Re-fetch to verify still needs rollover (double-check pattern)
            conn.row_factory = sqlite3.Row
            fresh_row = conn.execute(
                """
                SELECT id, user_id, title, description, frequency_per_week, frequency_type,
                       target_count, custom_days, completed, streak, period_start,
                       last_completed_date, created_at, updated_at
                  FROM goals WHERE id = ? AND user_id = ?
                """,
                (goal_dict["id"], goal_dict["user_id"]),
            ).fetchone()

            if not fresh_row:
                if not in_transaction:
                    conn.rollback()
                goal_dict["already_completed_today"] = False
                return goal_dict

            fresh_dict = dict(fresh_row)

            # Another request may have already rolled over
            if (fresh_dict.get("period_start") or "") == today_start:
                if not in_transaction:
                    conn.rollback()
                fresh_dict["already_completed_today"] = (
                    fresh_dict.get("last_completed_date") == today_str
                )
                return fresh_dict

            # Perform rollover
            current_completed = int(fresh_dict.get("completed") or 0)
            freq = self._goal_target_total(fresh_dict)
            streak = int(fresh_dict.get("streak") or 0)

            if freq > 0 and current_completed >= freq:
                streak += 1
            else:
                streak = 0

            conn.execute(
                """
                UPDATE goals
                   SET completed = ?,
                       streak = ?,
                       period_start = ?,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND user_id = ?
                """,
                (0, streak, today_start, fresh_dict["id"], fresh_dict["user_id"]),
            )
            if not in_transaction:
                conn.commit()

            # Fetch updated record
            refreshed = conn.execute(
                """
                SELECT id, user_id, title, description, frequency_per_week, frequency_type,
                       target_count, custom_days, completed, streak, period_start,
                       last_completed_date, created_at, updated_at
                  FROM goals WHERE id = ? AND user_id = ?
                """,
                (fresh_dict["id"], fresh_dict["user_id"]),
            ).fetchone()

            out = dict(refreshed) if refreshed else fresh_dict
            out["already_completed_today"] = out.get("last_completed_date") == today_str
            return out

        except sqlite3.Error as exc:
            if not in_transaction:
                conn.rollback()
            else:
                raise
            logger.warning("Goal rollover failed, returning stale data: %s", exc)
            goal_dict["already_completed_today"] = (
                goal_dict.get("last_completed_date") == today_str
            )
            return goal_dict

    # CRUD operations -----------------------------------------------------------
    def create_goal(
        self,
        user_id: int,
        title: str,
        description: str,
        frequency_per_week: int = 1,
        frequency_type: str = "weekly",
        target_count: int = 1,
        custom_days: Optional[str] = None,
    ) -> int:
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("user_id must be a positive integer")
        if not title or not title.strip():
            raise ValueError("Title is required and cannot be empty")
        if frequency_type not in ("daily", "weekly", "monthly", "custom"):
            raise ValueError("frequency_type must be daily, weekly, monthly, or custom")
        if target_count < 1:
            raise ValueError("target_count must be at least 1")

        # For weekly: validate frequency_per_week
        if frequency_type == "weekly" and not (1 <= frequency_per_week <= 7):
            raise ValueError("frequency_per_week must be between 1 and 7 for weekly goals")
        if frequency_type == "custom" and custom_days:
            try:
                parsed_days = json.loads(custom_days)
                if not isinstance(parsed_days, list) or not parsed_days:
                    raise ValueError("custom_days must be a non-empty list of weekdays")
                if any((not isinstance(d, int) or d < 0 or d > 6) for d in parsed_days):
                    raise ValueError("custom_days values must be weekday integers 0-6")
                target_count = len(parsed_days)
            except json.JSONDecodeError as exc:
                raise ValueError("custom_days must be JSON-encoded list of weekdays") from exc

        period_start = self._get_period_start(frequency_type)
        # Keep legacy weekly column in range while using target_count for non-weekly logic.
        persisted_weekly_target = (
            frequency_per_week if frequency_type == "weekly" else max(1, min(int(target_count), 7))
        )

        try:
            cursor = self._query(
                """
                INSERT INTO goals (user_id, title, description, frequency_per_week,
                                    completed, streak, period_start, frequency_type,
                                    target_count, custom_days)
                VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    title.strip(),
                    (description or "").strip(),
                    persisted_weekly_target,
                    period_start,
                    frequency_type,
                    target_count,
                    custom_days,
                ),
                commit=True,
            )
            goal_id = cursor.lastrowid
            if goal_id is None:
                raise DatabaseError("Failed to get goal ID after creation")
            return int(goal_id)
        except sqlite3.Error as exc:
            logger.error("Failed to create goal for user %s: %s", user_id, exc)
            raise DatabaseError(f"Failed to create goal: {exc}") from exc

    def get_goals(self, user_id: int) -> List[Dict]:
        with self._conn() as conn:
            rows = conn.execute(SQLQueries.GET_GOALS_BY_USER, (user_id,)).fetchall()
            return [self._rollover_goal_if_needed(conn, row) for row in rows]

    def get_goal_by_id(self, user_id: int, goal_id: int) -> Optional[Dict]:
        with self._conn() as conn:
            row = conn.execute(SQLQueries.GET_GOAL_BY_ID, (goal_id, user_id)).fetchone()
            if not row:
                return None
            return self._rollover_goal_if_needed(conn, row)

    # Whitelist of columns allowed for dynamic UPDATE in goals
    _GOAL_UPDATE_COLUMNS = frozenset(
        {"title", "description", "frequency_per_week", "frequency_type", "target_count", "custom_days"}
    )

    def update_goal(
        self,
        user_id: int,
        goal_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        frequency_per_week: Optional[int] = None,
        frequency_type: Optional[str] = None,
        target_count: Optional[int] = None,
        custom_days: Optional[str] = None,
    ) -> bool:
        updates: List[str] = []
        params: List[object] = []

        # Build updates from whitelisted columns only
        if title is not None and "title" in self._GOAL_UPDATE_COLUMNS:
            updates.append("title = ?")
            params.append(title.strip())
        if description is not None and "description" in self._GOAL_UPDATE_COLUMNS:
            updates.append("description = ?")
            params.append(description.strip())
        if frequency_per_week is not None and "frequency_per_week" in self._GOAL_UPDATE_COLUMNS:
            if frequency_per_week < 1 or frequency_per_week > 7:
                raise ValueError("frequency_per_week must be between 1 and 7")
            updates.append("frequency_per_week = ?")
            params.append(frequency_per_week)

        if frequency_type is not None and "frequency_type" in self._GOAL_UPDATE_COLUMNS:
            if frequency_type not in ("daily", "weekly", "monthly", "custom"):
                raise ValueError("frequency_type must be daily, weekly, monthly, or custom")
            updates.append("frequency_type = ?")
            params.append(frequency_type)
            updates.append("period_start = ?")
            params.append(self._get_period_start(frequency_type))

        if target_count is not None and "target_count" in self._GOAL_UPDATE_COLUMNS:
            if target_count < 1:
                raise ValueError("target_count must be at least 1")
            updates.append("target_count = ?")
            params.append(target_count)

        if custom_days is not None and "custom_days" in self._GOAL_UPDATE_COLUMNS:
            if custom_days:
                try:
                    parsed_days = json.loads(custom_days)
                    if not isinstance(parsed_days, list) or not parsed_days:
                        raise ValueError("custom_days must be a non-empty list of weekdays")
                    if any((not isinstance(d, int) or d < 0 or d > 6) for d in parsed_days):
                        raise ValueError("custom_days values must be weekday integers 0-6")
                    if target_count is None:
                        updates.append("target_count = ?")
                        params.append(len(parsed_days))
                except json.JSONDecodeError as exc:
                    raise ValueError("custom_days must be JSON-encoded list of weekdays") from exc
            updates.append("custom_days = ?")
            params.append(custom_days)

        # Always clamp completed count to current target after any target-related updates
        if (
            frequency_per_week is not None
            or target_count is not None
            or frequency_type is not None
        ):
            # Uses table columns directly to compute active target in SQL
            updates.append(
                "completed = MIN(completed, CASE WHEN COALESCE(frequency_type, 'weekly') = 'weekly' "
                "THEN COALESCE(frequency_per_week, 1) ELSE COALESCE(target_count, COALESCE(frequency_per_week, 1)) END)"
            )

        if not updates:
            return False

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([goal_id, user_id])

        # Column names are from hardcoded whitelist, safe for query
        cursor = self._query(
            f"UPDATE goals SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
            params,
            commit=True,
        )
        return cursor.rowcount > 0

    def delete_goal(self, user_id: int, goal_id: int) -> bool:
        cursor = self._query(
            "DELETE FROM goals WHERE id = ? AND user_id = ?",
            (goal_id, user_id),
            commit=True,
        )
        return cursor.rowcount > 0

    def increment_goal_progress(self, user_id: int, goal_id: int) -> Optional[Dict]:
        today_str = datetime.now().strftime("%Y-%m-%d")
        today_date = datetime.now().date()
        with self._write_transaction() as conn:
            row = conn.execute(
                "SELECT * FROM goals WHERE id = ? AND user_id = ?",
                (goal_id, user_id),
            ).fetchone()
            if not row:
                return None

            goal = self._rollover_goal_if_needed(conn, row, in_transaction=True)
            current_completed = int(goal.get("completed") or 0)
            freq = self._goal_target_total(goal)
            streak = int(goal.get("streak") or 0)
            period_start = goal.get("period_start")
            last_completed_date = goal.get("last_completed_date")

            if not self._is_custom_day_allowed(goal, today_date):
                result = dict(goal)
                result["already_completed_today"] = (
                    result.get("last_completed_date") == today_str
                )
                result["blocked_by_schedule"] = True
                return result

            if last_completed_date != today_str and current_completed < freq:
                current_completed += 1
                last_completed_date = today_str
            elif last_completed_date != today_str:
                last_completed_date = today_str

            conn.execute(
                """
                UPDATE goals
                   SET completed = ?,
                       streak = ?,
                       period_start = ?,
                       last_completed_date = COALESCE(?, last_completed_date),
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND user_id = ?
                """,
                (
                    current_completed,
                    streak,
                    period_start,
                    last_completed_date,
                    goal_id,
                    user_id,
                ),
            )

            if last_completed_date == today_str:
                try:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO goal_completions (user_id, goal_id, date)
                        VALUES (?, ?, ?)
                        """,
                        (user_id, goal_id, today_str),
                    )
                except sqlite3.Error:
                    pass

            updated = conn.execute(
                """
                SELECT id, user_id, title, description, frequency_per_week, frequency_type,
                       target_count, custom_days, completed, streak, period_start,
                       last_completed_date, created_at, updated_at
                  FROM goals WHERE id = ? AND user_id = ?
                """,
                (goal_id, user_id),
            ).fetchone()

            if not updated:
                return None

            result = dict(updated)
            result["already_completed_today"] = (
                result.get("last_completed_date") == today_str
            )
            return result

    def toggle_goal_completion(
        self, user_id: int, goal_id: int, date_str: str
    ) -> Optional[Dict]:
        """Toggle goal completion for a specific date.

        If completion exists for that date, remove it.
        If completion doesn't exist, add it.
        Updates completed count based on actual completions in the toggled date's week.
        """
        with self._write_transaction() as conn:
            # Verify goal exists and belongs to user
            row = conn.execute(
                "SELECT * FROM goals WHERE id = ? AND user_id = ?",
                (goal_id, user_id),
            ).fetchone()
            if not row:
                return None

            goal = self._rollover_goal_if_needed(conn, row, in_transaction=True)
            frequency_type = (goal.get("frequency_type") or "weekly").lower()
            freq = self._goal_target_total(goal)

            # Parse the toggled date and determine boundaries for goal frequency
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                period_start, period_end = self._get_period_bounds(frequency_type, target_date)
            except ValueError:
                # Fallback if date parsing fails
                period_start = goal.get("period_start") or date_str
                period_end = period_start
                target_date = datetime.now().date()

            custom_day_allowed = self._is_custom_day_allowed(goal, target_date)

            # Check if completion exists for this date
            existing = conn.execute(
                "SELECT 1 FROM goal_completions WHERE user_id = ? AND goal_id = ? AND date = ?",
                (user_id, goal_id, date_str),
            ).fetchone()

            if not custom_day_allowed and not existing:
                result = dict(goal)
                today_str = datetime.now().strftime("%Y-%m-%d")
                result["already_completed_today"] = (
                    result.get("last_completed_date") == today_str
                )
                result["toggled_date"] = date_str
                result["is_completed"] = False
                result["blocked_by_schedule"] = True
                return result

            if existing:
                # Remove the completion
                conn.execute(
                    "DELETE FROM goal_completions WHERE user_id = ? AND goal_id = ? AND date = ?",
                    (user_id, goal_id, date_str),
                )
                was_completed = False
            else:
                # Add the completion
                conn.execute(
                    "INSERT INTO goal_completions (user_id, goal_id, date) VALUES (?, ?, ?)",
                    (user_id, goal_id, date_str),
                )
                was_completed = True

            # Count actual completions within the toggled date's week
            completion_count_row = conn.execute(
                """
                SELECT COUNT(*) as cnt FROM goal_completions
                WHERE user_id = ? AND goal_id = ? AND date >= ? AND date <= ?
                """,
                (user_id, goal_id, period_start, period_end),
            ).fetchone()
            actual_completed = completion_count_row["cnt"] if completion_count_row else 0

            # Cap at frequency for display purposes
            display_completed = min(actual_completed, freq) if freq > 0 else actual_completed

            # Update the goals table with the recalculated count and the new period_start
            # if we're toggling a date in a different week
            conn.execute(
                """
                UPDATE goals
                   SET completed = ?,
                       period_start = ?,
                       last_completed_date = ?,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND user_id = ?
                """,
                (display_completed, period_start, date_str if was_completed else None, goal_id, user_id),
            )

            # Return updated goal state
            updated = conn.execute(
                """
                SELECT id, user_id, title, description, frequency_per_week, frequency_type,
                       target_count, custom_days, completed, streak, period_start,
                       last_completed_date, created_at, updated_at
                  FROM goals WHERE id = ? AND user_id = ?
                """,
                (goal_id, user_id),
            ).fetchone()

            if not updated:
                return None

            result = dict(updated)
            today_str = datetime.now().strftime("%Y-%m-%d")
            result["already_completed_today"] = result.get("last_completed_date") == today_str
            result["toggled_date"] = date_str
            result["is_completed"] = was_completed
            return result

    def get_goal_completions(
        self,
        user_id: int,
        goal_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict]:
        if not start_date or not end_date:
            end = datetime.now().date()
            start = end - timedelta(days=90)
            start_date = start.strftime("%Y-%m-%d")
            end_date = end.strftime("%Y-%m-%d")

        cursor = self._query(
            """
            SELECT date
              FROM goal_completions
             WHERE user_id = ? AND goal_id = ? AND date BETWEEN ? AND ?
             ORDER BY date ASC
            """,
            (user_id, goal_id, start_date, end_date),
        )
        return [dict(row) for row in cursor.fetchall()]


__all__ = ["GoalsMixin"]
