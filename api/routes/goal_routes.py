from flask import Blueprint, request, jsonify
import json
import logging
from api.services.goal_service import GoalService
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.secure_errors import secure_error_response
from api.validators import ValidationError, GoalCreate, GoalUpdate

logger = logging.getLogger(__name__)


def create_goal_routes(goal_service: GoalService):
    bp = Blueprint("goals", __name__)

    @bp.route("/goals", methods=["GET"])
    @require_auth
    def list_goals():
        try:
            user_id = get_current_user_id()
            goals = goal_service.list_goals(user_id)
            return jsonify(goals)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/goals", methods=["POST"])
    @require_auth
    def create_goal():
        try:
            user_id = get_current_user_id()
            data = request.json or {}

            try:
                frequency_raw = data.get("frequency_per_week") or data.get("frequency") or 1
                validated = GoalCreate(
                    title=data.get("title", "").strip(),
                    description=(data.get("description") or "").strip(),
                    frequency_per_week=int(frequency_raw),
                    frequency_type=data.get("frequency_type", "weekly"),
                    target_count=int(data.get("target_count", 1)),
                    custom_days=(
                        json.dumps(data.get("custom_days"))
                        if isinstance(data.get("custom_days"), list)
                        else data.get("custom_days")
                    ),
                )
            except (TypeError, ValueError) as e:
                return jsonify({"error": str(e)}), 400
            except ValidationError as e:
                return jsonify({"error": e.message, "field": e.field}), 422

            goal_id = goal_service.create_goal(
                user_id,
                validated.title,
                validated.description,
                validated.frequency_per_week,
                validated.frequency_type,
                validated.target_count,
                validated.custom_days,
            )
            return jsonify({"id": goal_id}), 201
        except ValidationError as e:
            return jsonify({"error": e.message, "field": e.field}), 422
        except ValueError as e:
            # SECURITY: Log but don't expose validation details
            logger.warning(f"Goal validation error: {e}")
            return jsonify({"error": "Invalid input"}), 400
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/goals/<int:goal_id>", methods=["GET"])
    @require_auth
    def get_goal(goal_id: int):
        try:
            user_id = get_current_user_id()
            goal = goal_service.get_goal(user_id, goal_id)
            if not goal:
                return jsonify({"error": "Not found"}), 404
            return jsonify(goal)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/goals/<int:goal_id>", methods=["PUT", "PATCH"])
    @require_auth
    def update_goal(goal_id: int):
        try:
            user_id = get_current_user_id()
            data = request.json or {}

            frequency = data.get("frequency_per_week")
            if frequency is None:
                # Accept `frequency` alias from UI
                frequency = data.get("frequency")

            try:
                validated = GoalUpdate(
                    title=data.get("title"),
                    description=data.get("description"),
                    frequency_per_week=int(frequency) if frequency is not None else None,
                    frequency_type=data.get("frequency_type"),
                    target_count=int(data.get("target_count")) if data.get("target_count") is not None else None,
                    custom_days=(
                        json.dumps(data.get("custom_days"))
                        if isinstance(data.get("custom_days"), list)
                        else data.get("custom_days")
                    ),
                )
            except (TypeError, ValueError) as e:
                return jsonify({"error": str(e)}), 400
            except ValidationError as e:
                return jsonify({"error": e.message, "field": e.field}), 422

            success = goal_service.update_goal(
                user_id,
                goal_id,
                validated.title,
                validated.description,
                validated.frequency_per_week,
                validated.frequency_type,
                validated.target_count,
                validated.custom_days,
            )
            if not success:
                return jsonify({"error": "No changes or goal not found"}), 404
            return jsonify({"status": "ok"})
        except ValidationError as e:
            return jsonify({"error": e.message, "field": e.field}), 422
        except ValueError as e:
            logger.warning(f"Goal update validation error: {e}")
            return jsonify({"error": "Invalid input"}), 400
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/goals/<int:goal_id>", methods=["DELETE"])
    @require_auth
    def delete_goal(goal_id: int):
        try:
            user_id = get_current_user_id()
            success = goal_service.delete_goal(user_id, goal_id)
            if not success:
                return jsonify({"error": "Not found"}), 404
            return jsonify({"status": "ok"})
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/goals/<int:goal_id>/progress", methods=["POST"])
    @require_auth
    def increment_progress(goal_id: int):
        try:
            user_id = get_current_user_id()
            updated = goal_service.increment_progress(user_id, goal_id)
            if not updated:
                return jsonify({"error": "Not found"}), 404
            return jsonify(updated)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route("/goals/<int:goal_id>/toggle-completion", methods=["POST"])
    @require_auth
    def toggle_completion(goal_id: int):
        try:
            user_id = get_current_user_id()
            data = request.json or {}
            date_str = data.get("date")
            if not date_str:
                return jsonify({"error": "date is required"}), 400
            updated = goal_service.toggle_completion(user_id, goal_id, date_str)
            if not updated:
                return jsonify({"error": "Not found"}), 404
            return jsonify(updated)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route(
        "/goals/<int:goal_id>/completions",
        methods=["GET", "OPTIONS"],
        strict_slashes=False,
    )
    @bp.route(
        "/goals/<int:goal_id>/completions/",
        methods=["GET", "OPTIONS"],
        strict_slashes=False,
    )
    @bp.route(
        "/goal/<int:goal_id>/completions",
        methods=["GET", "OPTIONS"],
        strict_slashes=False,
    )
    @require_auth
    def get_completions(goal_id: int):
        try:
            user_id = get_current_user_id()
            start_date = request.args.get("start")
            end_date = request.args.get("end")
            rows = goal_service.get_completions(user_id, goal_id, start_date, end_date)
            return jsonify(rows)
        except Exception as e:
            return secure_error_response(e, 500)

    return bp
