from flask import Blueprint, request, jsonify

try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id


def create_reminder_routes(scheduler_service, push_service):
    bp = Blueprint('reminders', __name__)

    @bp.route('/push/vapid-public-key', methods=['GET'])
    @require_auth
    def get_vapid_key():
        key = push_service.get_vapid_public_key()
        if not key:
            return jsonify({"error": "VAPID keys not configured"}), 500
        return jsonify({"publicKey": key})

    @bp.route('/push/subscribe', methods=['POST'])
    @require_auth
    def subscribe():
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401
        data = request.json
        if not data:
            return jsonify({"error": "Missing subscription data"}), 400
        
        success = push_service.subscribe_user(user_id, data)
        if success:
            # Send a test notification immediately? Maybe not, can be annoying.
            # But it confirms it works.
            # push_service.send_notification(user_id, "Notifications enabled successfully!")
            return jsonify({"status": "subscribed"}), 201
        return jsonify({"error": "Failed to subscribe"}), 400

    @bp.route('/reminders', methods=['GET'])
    @require_auth
    def get_reminders():
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401
        reminders = scheduler_service.get_user_reminders(user_id)
        return jsonify(reminders)

    @bp.route('/reminders', methods=['POST'])
    @require_auth
    def create_reminder():
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401
        data = request.json or {}
        time = data.get('time')
        days = data.get('days', [0, 1, 2, 3, 4, 5, 6]) # Default all days
        message = data.get('message')
        goal_id = data.get('goal_id')
        is_active = data.get('is_active', True)
        
        if not time:
            return jsonify({"error": "Time is required"}), 400

        try:
            reminder_id = scheduler_service.create_reminder(
                user_id,
                time,
                days,
                message=message,
                goal_id=goal_id,
                is_active=is_active,
            )
        except ValueError:
            return jsonify({"error": "Invalid reminder parameters"}), 400
        return jsonify({"status": "created", "id": reminder_id}), 201

    @bp.route('/reminders/<int:reminder_id>', methods=['PUT'])
    @require_auth
    def update_reminder(reminder_id):
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401
        data = request.json or {}
        if not data:
            return jsonify({"error": "No updates provided"}), 400

        update_kwargs = {}
        if "time" in data:
            update_kwargs["time"] = data.get("time")
        if "days" in data:
            update_kwargs["days"] = data.get("days")
        if "message" in data:
            update_kwargs["message"] = data.get("message")
        if "goal_id" in data:
            update_kwargs["goal_id"] = data.get("goal_id")
        if "is_active" in data:
            update_kwargs["is_active"] = data.get("is_active")

        try:
            success = scheduler_service.update_reminder(
                user_id,
                reminder_id,
                **update_kwargs,
            )
        except ValueError:
            return jsonify({"error": "Invalid reminder parameters"}), 400
        if not success:
            return jsonify({"error": "Reminder not found or no changes applied"}), 404
        return jsonify({"status": "updated"})

    @bp.route('/reminders/<int:reminder_id>', methods=['DELETE'])
    @require_auth
    def delete_reminder(reminder_id):
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401
        scheduler_service.delete_reminder(user_id, reminder_id)
        return jsonify({"status": "deleted"})

    @bp.route('/push/test', methods=['POST'])
    @require_auth
    def test_push():
        """Send a test notification to self."""
        user_id = get_current_user_id()
        if not isinstance(user_id, int):
            return jsonify({"error": "Unauthorized"}), 401
        count = push_service.send_notification(user_id, "This is a test notification from Twilightio!")
        if count > 0:
            return jsonify({"message": f"Sent to {count} devices"})
        return jsonify({"error": "No active subscriptions found"}), 404

    return bp
