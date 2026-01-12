"""API routes for custom scale tracking."""

from flask import Blueprint, request, jsonify

try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id


def create_scale_routes(db):
    """Create routes for managing custom scales."""
    bp = Blueprint('scales', __name__)

    @bp.route('/scales', methods=['GET'])
    @require_auth
    def get_scales():
        """Get all active scales for the current user."""
        user_id = get_current_user_id()
        scales = db.get_user_scales(user_id)
        return jsonify(scales)

    @bp.route('/scales', methods=['POST'])
    @require_auth
    def create_scale():
        """Create a new scale definition."""
        user_id = get_current_user_id()
        data = request.get_json()
        
        name = data.get('name')
        if not name:
            return jsonify({"error": "Name is required"}), 400
        
        scale_id = db.create_scale(
            user_id=user_id,
            name=name,
            min_label=data.get('min_label'),
            max_label=data.get('max_label'),
            color_hex=data.get('color_hex'),
        )
        
        return jsonify({"id": scale_id, "name": name}), 201

    @bp.route('/scales/entries', methods=['GET'])
    @require_auth
    def get_scale_entries():
        """Get all scale entries for the current user."""
        user_id = get_current_user_id()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        entries = db.get_user_scale_entries(user_id, start_date, end_date)
        return jsonify(entries)

    @bp.route('/scales/<int:scale_id>', methods=['PUT'])
    @require_auth
    def update_scale(scale_id):
        """Update a scale definition."""
        user_id = get_current_user_id()
        data = request.get_json()
        
        updated = db.update_scale(
            user_id=user_id,
            scale_id=scale_id,
            name=data.get('name'),
            min_label=data.get('min_label'),
            max_label=data.get('max_label'),
            color_hex=data.get('color_hex'),
            is_active=data.get('is_active'),
        )
        
        if updated:
            return jsonify(updated)
        else:
            return jsonify({"error": "Failed to update scale"}), 500

    @bp.route('/scales/<int:scale_id>', methods=['DELETE'])
    @require_auth
    def delete_scale(scale_id):
        """Soft delete a scale."""
        user_id = get_current_user_id()
        success = db.delete_scale(user_id, scale_id)
        
        if success:
            return jsonify({"success": True})
        else:
            return jsonify({"error": "Scale not found"}), 404

    @bp.route('/entries/<int:entry_id>/scales', methods=['GET'])
    @require_auth
    def get_entry_scales(entry_id):
        """Get scale values for a specific mood entry."""
        scale_entries = db.get_scale_entries_for_mood(entry_id)
        return jsonify(scale_entries)

    return bp
