"""API routes for Important Days / Countdowns."""

from flask import Blueprint, request, jsonify
import logging
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.secure_errors import secure_error_response

logger = logging.getLogger(__name__)


def create_important_days_routes(db):
    """Create blueprint for important days endpoints."""
    bp = Blueprint("important_days", __name__)

    @bp.route("/important-days", methods=["GET"])
    @require_auth
    def get_important_days():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            days = db.get_important_days(user_id)
            return jsonify({"days": days})
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/important-days", methods=["POST"])
    @require_auth
    def create_important_day():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            data = request.get_json(silent=True) or {}
            title = data.get("title")
            target_date = data.get("date")
            
            if not title or not target_date:
                return jsonify({"error": "Title and date are required"}), 400
            
            day_id = db.create_important_day(
                user_id=user_id,
                title=title,
                target_date=target_date,
                category=data.get("category", "Custom"),
                icon=data.get("icon", "calendar"),
                recurring_type=data.get("recurring_type", "once"),
                remind_days_before=data.get("remind_days_before", 1),
                notes=data.get("notes"),
            )
            
            day = db.get_important_day_by_id(user_id, day_id)
            return jsonify({"status": "success", "day": day}), 201
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/important-days/<int:day_id>", methods=["PUT"])
    @require_auth
    def update_important_day(day_id):
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            data = request.get_json(silent=True) or {}
            
            success = db.update_important_day(
                user_id=user_id,
                day_id=day_id,
                title=data.get("title"),
                target_date=data.get("date"),
                category=data.get("category"),
                icon=data.get("icon"),
                recurring_type=data.get("recurring_type"),
                remind_days_before=data.get("remind_days_before"),
                notes=data.get("notes"),
            )
            
            if not success:
                return jsonify({"error": "Important day not found"}), 404
            
            day = db.get_important_day_by_id(user_id, day_id)
            return jsonify({"status": "success", "day": day})
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/important-days/<int:day_id>", methods=["DELETE"])
    @require_auth
    def delete_important_day(day_id):
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            success = db.delete_important_day(user_id, day_id)
            
            if not success:
                return jsonify({"error": "Important day not found"}), 404
            
            return jsonify({"status": "success", "message": "Important day deleted"})
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/important-days/upcoming", methods=["GET"])
    @require_auth
    def get_upcoming_important_days():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            days_ahead = request.args.get("days", 30, type=int)
            days = db.get_upcoming_important_days(user_id, days_ahead)
            return jsonify({"days": days})
        except Exception as e:
            return secure_error_response(e, 500)

    return bp
