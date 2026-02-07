"""API routes for Important Days / Countdowns."""

from flask import Blueprint, request, jsonify
import logging
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.secure_errors import secure_error_response
from api.validators import ValidationError, ImportantDayCreate, ImportantDayUpdate
from api.utils.responses import success_response, error_response, not_found_response

logger = logging.getLogger(__name__)


def create_important_days_routes(important_days_service):
    """Create blueprint for important days endpoints.

    Args:
        important_days_service: ImportantDaysService instance for important days operations
    """
    bp = Blueprint("important_days", __name__)

    @bp.route("/important-days", methods=["GET"])
    @require_auth
    def get_important_days():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return error_response("Unauthorized", status=401)

            days = important_days_service.get_important_days(user_id)
            return success_response(data={"days": days})
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

            try:
                validated = ImportantDayCreate(
                    title=data.get("title"),
                    target_date=data.get("date"),
                    category=data.get("category", "Custom"),
                    icon=data.get("icon", "calendar"),
                    recurring_type=data.get("recurring_type", "once"),
                    remind_days_before=int(data.get("remind_days_before", 1)),
                    notes=data.get("notes"),
                )
            except (TypeError, ValueError) as e:
                return jsonify({"error": str(e)}), 400
            except ValidationError as e:
                return jsonify({"error": e.message, "field": e.field}), 422

            day_id = important_days_service.create_important_day(
                user_id=user_id,
                title=validated.title,
                target_date=validated.target_date,
                category=validated.category,
                icon=validated.icon,
                recurring_type=validated.recurring_type,
                remind_days_before=validated.remind_days_before,
                notes=validated.notes,
            )

            day = important_days_service.get_important_day_by_id(user_id, day_id)
            return success_response(data={"day": day}, status=201)
        except ValidationError as e:
            return error_response(e.message, details={"field": e.field}, status=422)
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

            try:
                remind_days = data.get("remind_days_before")
                validated = ImportantDayUpdate(
                    title=data.get("title"),
                    target_date=data.get("date"),
                    category=data.get("category"),
                    icon=data.get("icon"),
                    recurring_type=data.get("recurring_type"),
                    remind_days_before=int(remind_days) if remind_days is not None else None,
                    notes=data.get("notes"),
                )
            except (TypeError, ValueError) as e:
                return jsonify({"error": str(e)}), 400
            except ValidationError as e:
                return jsonify({"error": e.message, "field": e.field}), 422

            success = important_days_service.update_important_day(
                user_id=user_id,
                day_id=day_id,
                title=validated.title,
                target_date=validated.target_date,
                category=validated.category,
                icon=validated.icon,
                recurring_type=validated.recurring_type,
                remind_days_before=validated.remind_days_before,
                notes=validated.notes,
            )

            if not success:
                return not_found_response("Important day")

            day = important_days_service.get_important_day_by_id(user_id, day_id)
            return success_response(data={"day": day})
        except ValidationError as e:
            return error_response(e.message, details={"field": e.field}, status=422)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/important-days/<int:day_id>", methods=["DELETE"])
    @require_auth
    def delete_important_day(day_id):
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return error_response("Unauthorized", status=401)

            deleted = important_days_service.delete_important_day(user_id, day_id)

            if not deleted:
                return not_found_response("Important day")

            return success_response(message="Important day deleted")
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/important-days/upcoming", methods=["GET"])
    @require_auth
    def get_upcoming_important_days():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return error_response("Unauthorized", status=401)

            days_ahead = request.args.get("days", 30, type=int)
            days = important_days_service.get_upcoming_important_days(user_id, days_ahead)
            return success_response(data={"days": days})
        except Exception as e:
            return secure_error_response(e, 500)

    return bp
