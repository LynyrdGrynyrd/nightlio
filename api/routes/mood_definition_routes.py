"""API routes for custom mood definitions."""

from flask import Blueprint, request, jsonify

try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id


def create_mood_definition_routes(db):
    """Create routes for managing custom mood definitions."""
    bp = Blueprint('mood_definitions', __name__)

    @bp.route('/mood-definitions', methods=['GET'])
    @require_auth
    def get_mood_definitions():
        """Get all mood definitions for the current user."""
        user_id = get_current_user_id()
        definitions = db.get_user_mood_definitions(user_id)
        return jsonify(definitions)

    @bp.route('/mood-definitions/<int:score>', methods=['PUT'])
    @require_auth
    def update_mood_definition(score):
        """Update a specific mood definition."""
        if score < 1 or score > 5:
            return jsonify({"error": "Score must be between 1 and 5"}), 400
        
        user_id = get_current_user_id()
        data = request.get_json()
        
        label = data.get('label')
        icon = data.get('icon')
        color_hex = data.get('color_hex')
        
        if not any([label, icon, color_hex]):
            return jsonify({"error": "At least one of label, icon, or color_hex is required"}), 400
        
        updated = db.update_mood_definition(
            user_id=user_id,
            score=score,
            label=label,
            icon=icon,
            color_hex=color_hex
        )
        
        if updated:
            return jsonify(updated)
        else:
            return jsonify({"error": "Failed to update mood definition"}), 500

    return bp
