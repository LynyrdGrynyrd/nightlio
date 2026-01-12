class SettingsService:
    def __init__(self, db):
        self.db = db

    def get_settings(self, user_id):
        return self.db.get_user_settings(user_id)

    def set_pin(self, user_id, pin):
        self.db.set_user_pin(user_id, pin)

    def verify_pin(self, user_id, pin):
        return self.db.verify_user_pin(user_id, pin)

    def remove_pin(self, user_id):
        self.db.remove_user_pin(user_id)

    def update_lock_timeout(self, user_id, seconds):
        self.db.update_lock_timeout(user_id, seconds)
