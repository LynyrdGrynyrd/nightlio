"""Routes for user settings and specialized auth."""

from flask import Blueprint, request, jsonify
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.rate_limiter import rate_limit

def create_settings_routes(settings_service):
    settings_bp = Blueprint("settings", __name__)

    @settings_bp.route("/user/settings", methods=["GET"])
    @require_auth
    def get_settings():
        user_id = get_current_user_id()
        settings = settings_service.get_settings(user_id)
        # Convert to dict and sanitize
        settings_dict = dict(settings)
        settings_dict["has_pin"] = bool(settings_dict.get("pin_hash"))
        settings_dict.pop("pin_hash", None)
        return jsonify(settings_dict)

    @settings_bp.route("/auth/pin", methods=["PUT"])
    @require_auth
    @rate_limit(max_requests=10, window_minutes=5)  # SECURITY: Limit PIN changes
    def set_pin():
        user_id = get_current_user_id()
        data = request.get_json()
        pin = data.get("pin")
        
        if not pin or not pin.isdigit() or len(pin) < 4:
            return jsonify({"error": "PIN must be at least 4 digits"}), 400
            
        settings_service.set_pin(user_id, pin)
        return jsonify({"message": "PIN updated successfully"})

    @settings_bp.route("/auth/pin", methods=["DELETE"])
    @require_auth
    def remove_pin():
        user_id = get_current_user_id()
        settings_service.remove_pin(user_id)
        return jsonify({"message": "PIN removed"})

    @settings_bp.route("/auth/verify-pin", methods=["POST"])
    @require_auth
    @rate_limit(max_requests=5, window_minutes=1)  # SECURITY: Prevent PIN brute-force
    def verify_pin():
        user_id = get_current_user_id()
        data = request.get_json()
        pin = data.get("pin")
        
        is_valid = settings_service.verify_pin(user_id, pin)
        return jsonify({"valid": is_valid})

    @settings_bp.route("/user/settings/lock-timeout", methods=["PUT"])
    @require_auth
    def set_lock_timeout():
        user_id = get_current_user_id()
        data = request.get_json()
        seconds = data.get("seconds")
        
        if seconds is None or not isinstance(seconds, int) or seconds < 0:
            return jsonify({"error": "Invalid timeout seconds"}), 400
            
        settings_service.update_lock_timeout(user_id, seconds)
        return jsonify({"message": "Timeout updated"})

    return settings_bp
