from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)
_UNSET = object()

class SchedulerService:
    def __init__(self, db, push_service):
        self.db = db
        self.push_service = push_service
        self.scheduler = BackgroundScheduler()
        self.started = False
        self.health_status = {
            'check_reminders': {'last_run': None, 'last_error': None, 'last_success': None},
            'check_important_days': {'last_run': None, 'last_error': None, 'last_success': None}
        }

    def start(self):
        """Start the scheduler and add static jobs."""
        if not self.started:
            # Check for due reminders every minute
            self.scheduler.add_job(
                self.check_reminders,
                trigger=CronTrigger(second=0), # Run at the top of every minute
                id='check_reminders',
                name='Check Mood Reminders',
                replace_existing=True
            )
            
            # Check for Important Days reminders daily at 9:00 AM
            self.scheduler.add_job(
                self.check_important_day_reminders,
                trigger=CronTrigger(hour=9, minute=0),
                id='check_important_days',
                name='Check Important Days Reminders',
                replace_existing=True
            )
            
            self.scheduler.start()
            self.started = True
            logger.info("Scheduler started with mood and important days reminder jobs.")

    def shutdown(self):
        if self.started:
            self.scheduler.shutdown()
            self.started = False

    def get_health_status(self):
        return self.health_status

    def check_reminders(self):
        """Job to check if any reminders are due at the current minute."""
        now = datetime.now()
        self.health_status['check_reminders']['last_run'] = now
        
        current_time_str = now.strftime("%H:%M")
        current_weekday = now.weekday() # 0 = Monday, 6 = Sunday

        logger.debug(f"Checking reminders for {current_time_str} weekday {current_weekday}")

        try:
            with self.db._connect() as conn:
                conn.row_factory = None
                # Get active reminders for this exact time
                cursor = conn.execute(
                    """
                    SELECT r.id, r.user_id, r.days_of_week, r.message, r.goal_id, g.title
                    FROM reminders r
                    LEFT JOIN goals g ON g.id = r.goal_id AND g.user_id = r.user_id
                    WHERE is_active = 1 AND time = ?
                    """, 
                    (current_time_str,)
                )
                reminders = cursor.fetchall()

            for r_id, user_id, days_json, message, goal_id, goal_title in reminders:
                try:
                    days = json.loads(days_json)
                    if current_weekday in days:
                        # IT'S TIME!
                        logger.info(f"Sending reminder {r_id} to user {user_id}")
                        reminder_message = message or "Time to log your mood!"
                        if goal_id and goal_title:
                            reminder_message = f"{reminder_message} • Goal: {goal_title}"
                        self.push_service.send_notification(user_id, reminder_message)
                except Exception as e:
                    logger.error(f"Error processing reminder {r_id}: {e}")
            
            self.health_status['check_reminders']['last_success'] = datetime.now()

        except Exception as e:
            self.health_status['check_reminders']['last_error'] = str(e)
            logger.exception("Reminder check failed") # Logs full stack trace

    def check_important_day_reminders(self):
        """Daily job to check for Important Days that need reminder notifications."""
        logger.info("Checking Important Days reminders...")
        self.health_status['check_important_days']['last_run'] = datetime.now()
        
        try:
            # Get all users with push subscriptions
            with self.db._connect() as conn:
                conn.row_factory = None
                cursor = conn.execute("SELECT DISTINCT user_id FROM push_subscriptions")
                user_ids = [row[0] for row in cursor.fetchall()]
            
            for user_id in user_ids:
                try:
                    # Get all active important days for this user
                    important_days = self.db.get_important_days(user_id)
                    
                    for day in important_days:
                        days_until = day.get("days_until", 9999)
                        remind_days = day.get("remind_days_before", 1)
                        title = day.get("title", "Important Day")
                        
                        # Check if days_until matches remind_days_before
                        if days_until == remind_days and days_until >= 0:
                            if days_until == 0:
                                message = f"🎉 Today is {title}!"
                            elif days_until == 1:
                                message = f"📅 Tomorrow: {title}"
                            else:
                                message = f"📅 {title} is in {days_until} days"
                            
                            logger.info(f"Sending Important Day reminder to user {user_id}: {message}")
                            self.push_service.send_notification(user_id, message)
                            
                except Exception as e:
                    logger.error(f"Error checking important days for user {user_id}: {e}")
            
            self.health_status['check_important_days']['last_success'] = datetime.now()
                    
        except Exception as e:
            self.health_status['check_important_days']['last_error'] = str(e)
            logger.exception("Important Days reminder check failed")

    @staticmethod
    def _normalize_days(days, *, strict=False):
        if not isinstance(days, list):
            if strict:
                raise ValueError("days must be an array of weekday integers (0-6)")
            return [0, 1, 2, 3, 4, 5, 6]
        unique_days = sorted({
            int(day)
            for day in days
            if isinstance(day, (int, str)) and str(day).isdigit() and 0 <= int(day) <= 6
        })
        if unique_days:
            return unique_days
        if strict:
            raise ValueError("days must contain at least one weekday (0-6)")
        return [0, 1, 2, 3, 4, 5, 6]

    @staticmethod
    def _normalize_time(time_str):
        if not isinstance(time_str, str):
            raise ValueError("time must be a string in HH:MM format")
        trimmed = time_str.strip()
        try:
            parsed = datetime.strptime(trimmed, "%H:%M")
        except ValueError as exc:
            raise ValueError("time must be in HH:MM 24-hour format") from exc
        return parsed.strftime("%H:%M")

    def _normalize_goal_id(self, user_id, goal_id):
        if goal_id in (None, "", "none"):
            return None
        try:
            normalized_goal_id = int(goal_id)
        except (TypeError, ValueError) as exc:
            raise ValueError("goal_id must be a valid integer") from exc

        with self.db._connect() as conn:
            conn.row_factory = None
            row = conn.execute(
                "SELECT id FROM goals WHERE id = ? AND user_id = ?",
                (normalized_goal_id, user_id),
            ).fetchone()
        if row is None:
            raise ValueError("goal_id not found for this user")
        return normalized_goal_id

    def create_reminder(self, user_id, time, days, message=None, goal_id=None, is_active=True):
        """Create a new reminder for a user."""
        normalized_time = self._normalize_time(time)
        normalized_days = self._normalize_days(days, strict=True)
        normalized_goal_id = self._normalize_goal_id(user_id, goal_id)
        normalized_message = (message or "").strip() or "Time to log your mood!"
        with self.db._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO reminders (user_id, time, days_of_week, message, goal_id, is_active, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (
                    user_id,
                    normalized_time,
                    json.dumps(normalized_days),
                    normalized_message,
                    normalized_goal_id,
                    1 if is_active else 0,
                ),
            )
            conn.commit()
            return int(cursor.lastrowid or 0)

    def get_user_reminders(self, user_id):
        with self.db._connect() as conn:
            conn.row_factory = None
            cursor = conn.execute(
                """
                SELECT id, time, days_of_week, message, goal_id, is_active, created_at, updated_at
                FROM reminders
                WHERE user_id = ?
                ORDER BY time ASC
                """,
                (user_id,)
            )
            rows = cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "time": r[1],
                    "days": json.loads(r[2]),
                    "message": r[3],
                    "goal_id": r[4],
                    "is_active": bool(r[5]),
                    "isActive": bool(r[5]),  # backward compat
                    "created_at": r[6],
                    "updated_at": r[7],
                }
                for r in rows
            ]

    def update_reminder(
        self,
        user_id,
        reminder_id,
        *,
        time=_UNSET,
        days=_UNSET,
        message=_UNSET,
        goal_id=_UNSET,
        is_active=_UNSET,
    ):
        updates = []
        params = []

        if time is not _UNSET:
            normalized_time = self._normalize_time(time)
            updates.append("time = ?")
            params.append(normalized_time)
        if days is not _UNSET:
            normalized_days = self._normalize_days(days, strict=True)
            updates.append("days_of_week = ?")
            params.append(json.dumps(normalized_days))
        if message is not _UNSET:
            normalized_message = (message or "").strip() or "Time to log your mood!"
            updates.append("message = ?")
            params.append(normalized_message)
        if goal_id is not _UNSET:
            normalized_goal_id = self._normalize_goal_id(user_id, goal_id)
            updates.append("goal_id = ?")
            params.append(normalized_goal_id)
        if is_active is not _UNSET:
            updates.append("is_active = ?")
            params.append(1 if is_active else 0)

        if not updates:
            return False

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([reminder_id, user_id])

        with self.db._connect() as conn:
            cursor = conn.execute(
                f"UPDATE reminders SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
                params,
            )
            conn.commit()
            return cursor.rowcount > 0
            
    def delete_reminder(self, user_id, reminder_id):
        with self.db._connect() as conn:
            conn.execute("DELETE FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id))
            conn.commit()
