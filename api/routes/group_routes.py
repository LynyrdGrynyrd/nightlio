from flask import Blueprint, request, jsonify
import logging
from api.services.group_service import GroupService
from api.utils.secure_errors import secure_error_response

logger = logging.getLogger(__name__)


def create_group_routes(group_service: GroupService):
    group_bp = Blueprint("group", __name__)

    @group_bp.route("/groups", methods=["GET"])
    def get_groups():
        try:
            groups = group_service.get_all_groups()
            return jsonify(groups)

        except Exception as e:
            return secure_error_response(e, 500)

    @group_bp.route("/groups", methods=["POST"])
    def create_group():
        try:
            data = request.json
            name = data.get("name")

            if not name:
                return jsonify({"error": "Group name is required"}), 400

            group_id = group_service.create_group(name)

            return (
                jsonify(
                    {
                        "status": "success",
                        "group_id": group_id,
                        "message": "Group created successfully",
                    }
                ),
                201,
            )

        except ValueError as e:
            logger.warning(f"Group validation error: {e}")
            return jsonify({"error": "Invalid input"}), 400
        except Exception as e:
            return secure_error_response(e, 500)

    @group_bp.route("/groups/<int:group_id>/options", methods=["POST"])
    def create_group_option(group_id):
        try:
            data = request.json
            name = data.get("name")
            icon = data.get("icon")

            if not name:
                return jsonify({"error": "Option name is required"}), 400

            option_id = group_service.create_group_option(group_id, name, icon)

            return (
                jsonify(
                    {
                        "status": "success",
                        "option_id": option_id,
                        "message": "Option created successfully",
                    }
                ),
                201,
            )

        except ValueError as e:
            logger.warning(f"Group option validation error: {e}")
            return jsonify({"error": "Invalid input"}), 400
        except Exception as e:
            return secure_error_response(e, 500)

    @group_bp.route("/groups/<int:group_id>", methods=["DELETE"])
    def delete_group(group_id):
        try:
            success = group_service.delete_group(group_id)

            if success:
                return jsonify(
                    {"status": "success", "message": "Group deleted successfully"}
                )
            else:
                return jsonify({"error": "Group not found"}), 404

        except Exception as e:
            return secure_error_response(e, 500)

    @group_bp.route("/options/<int:option_id>", methods=["DELETE"])
    def delete_option(option_id):
        try:
            success = group_service.delete_group_option(option_id)

            if success:
                return jsonify(
                    {"status": "success", "message": "Option deleted successfully"}
                )
            else:
                return jsonify({"error": "Option not found"}), 404

        except Exception as e:
            return secure_error_response(e, 500)

    @group_bp.route("/options/<int:option_id>/move", methods=["PUT"])
    def move_option(option_id):
        try:
            data = request.json
            new_group_id = data.get("group_id")

            if not new_group_id:
                return jsonify({"error": "New group ID is required"}), 400

            success = group_service.move_group_option(option_id, new_group_id)

            if success:
                return jsonify(
                    {"status": "success", "message": "Option moved successfully"}
                )
            else:
                return jsonify({"error": "Option or group not found"}), 404

        except Exception as e:
            return secure_error_response(e, 500)

    return group_bp
