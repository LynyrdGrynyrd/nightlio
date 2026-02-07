"""API routes for custom scale tracking."""

from flask import Blueprint, request, jsonify

try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
    from api.validators import ValidationError, ScaleCreate, ScaleUpdate
    from api.utils.responses import success_response, error_response, not_found_response
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id
    from validators import ValidationError, ScaleCreate, ScaleUpdate
    from utils.responses import success_response, error_response, not_found_response


def create_scale_routes(scale_service):
    """Create routes for managing custom scales.

    Args:
        scale_service: ScaleService instance for scale operations
    """
    bp = Blueprint('scales', __name__)

    @bp.route('/scales', methods=['GET'])
    @require_auth
    def get_scales():
        """Get all active scales for the current user."""
        user_id = get_current_user_id()
        scales = scale_service.get_user_scales(user_id)
        return success_response(data=scales)

    @bp.route('/scales', methods=['POST'])
    @require_auth
    def create_scale():
        """Create a new scale definition."""
        user_id = get_current_user_id()
        data = request.get_json() or {}

        try:
            validated = ScaleCreate(
                name=data.get('name'),
                min_label=data.get('min_label'),
                max_label=data.get('max_label'),
                color_hex=data.get('color_hex'),
            )
        except ValidationError as e:
            return jsonify({"error": e.message, "field": e.field}), 422

        scale_id = scale_service.create_scale(
            user_id=user_id,
            name=validated.name,
            min_label=validated.min_label,
            max_label=validated.max_label,
            color_hex=validated.color_hex,
        )

        return success_response(data={"id": scale_id, "name": validated.name}, status=201)

    @bp.route('/scales/entries', methods=['GET'])
    @require_auth
    def get_scale_entries():
        """Get all scale entries for the current user."""
        user_id = get_current_user_id()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        entries = scale_service.get_user_scale_entries(user_id, start_date, end_date)
        return success_response(data=entries)

    @bp.route('/scales/<int:scale_id>', methods=['PUT'])
    @require_auth
    def update_scale(scale_id):
        """Update a scale definition."""
        user_id = get_current_user_id()
        data = request.get_json() or {}

        try:
            validated = ScaleUpdate(
                name=data.get('name'),
                min_label=data.get('min_label'),
                max_label=data.get('max_label'),
                color_hex=data.get('color_hex'),
                is_active=data.get('is_active'),
            )
        except ValidationError as e:
            return jsonify({"error": e.message, "field": e.field}), 422

        updated = scale_service.update_scale(
            user_id=user_id,
            scale_id=scale_id,
            name=validated.name,
            min_label=validated.min_label,
            max_label=validated.max_label,
            color_hex=validated.color_hex,
            is_active=validated.is_active,
        )

        if updated:
            return success_response(data=updated)
        else:
            return error_response("Failed to update scale", status=500)

    @bp.route('/scales/<int:scale_id>', methods=['DELETE'])
    @require_auth
    def delete_scale(scale_id):
        """Soft delete a scale."""
        user_id = get_current_user_id()
        deleted = scale_service.delete_scale(user_id, scale_id)

        if deleted:
            return success_response(message="Scale deleted")
        else:
            return not_found_response("Scale")

    @bp.route('/entries/<int:entry_id>/scales', methods=['GET'])
    @require_auth
    def get_entry_scales(entry_id):
        """Get scale values for a specific mood entry."""
        user_id = get_current_user_id()
        # Verify entry belongs to user
        if not scale_service.verify_entry_ownership(entry_id, user_id):
            return not_found_response("Entry")
        scale_entries = scale_service.get_scale_entries_for_mood(entry_id)
        return success_response(data=scale_entries)

    @bp.route('/entries/<int:entry_id>/scales', methods=['POST'])
    @require_auth
    def save_entry_scales(entry_id):
        """Save scale values for a specific mood entry."""
        user_id = get_current_user_id()
        # Verify entry belongs to user
        if not scale_service.verify_entry_ownership(entry_id, user_id):
            return not_found_response("Entry")

        data = request.get_json() or {}
        scale_values = data.get('scales', {})

        # Convert string keys to int and validate values
        try:
            scale_values_int = {int(k): int(v) for k, v in scale_values.items()}
        except (ValueError, TypeError):
            return error_response("Invalid scale values")

        scale_service.save_scale_entries(entry_id, scale_values_int)
        return success_response(message="Scale values saved")

    return bp
