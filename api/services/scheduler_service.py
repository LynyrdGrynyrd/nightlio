from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

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
                    SELECT id, user_id, days_of_week, message 
                    FROM reminders 
                    WHERE is_active = 1 AND time = ?
                    """, 
                    (current_time_str,)
                )
                reminders = cursor.fetchall()

            for r_id, user_id, days_json, message in reminders:
                try:
                    days = json.loads(days_json)
                    if current_weekday in days:
                        # IT'S TIME!
                        logger.info(f"Sending reminder {r_id} to user {user_id}")
                        self.push_service.send_notification(user_id, message)
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

    def create_reminder(self, user_id, time, days):
        """Create a new reminder for a user."""
        with self.db._connect() as conn:
            conn.execute(
                "INSERT INTO reminders (user_id, time, days_of_week) VALUES (?, ?, ?)",
                (user_id, time, json.dumps(days))
            )

    def get_user_reminders(self, user_id):
        with self.db._connect() as conn:
            conn.row_factory = None
            cursor = conn.execute(
                "SELECT id, time, days_of_week, is_active FROM reminders WHERE user_id = ?",
                (user_id,)
            )
            rows = cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "time": r[1],
                    "days": json.loads(r[2]),
                    "isActive": bool(r[3])
                }
                for r in rows
            ]
            
    def delete_reminder(self, user_id, reminder_id):
        with self.db._connect() as conn:
             conn.execute("DELETE FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id))

