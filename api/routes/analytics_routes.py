from flask import Blueprint, jsonify, request
import logging
from api.services.analytics_service import AnalyticsService
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.secure_errors import secure_error_response

logger = logging.getLogger(__name__)


def create_analytics_routes(analytics_service: AnalyticsService):
    bp = Blueprint('analytics', __name__)

    @bp.route('/analytics/correlations', methods=['GET'])
    @require_auth
    def get_correlations():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            data = analytics_service.get_activity_correlations(user_id)
            return jsonify(data)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route('/analytics/co-occurrence', methods=['GET'])
    @require_auth
    def get_co_occurrence():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            data = analytics_service.get_tag_co_occurrence(user_id)
            return jsonify(data)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route('/analytics/co-occurrence/<int:mood>', methods=['GET'])
    @require_auth
    def get_co_occurrence_by_mood(mood):
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            data = analytics_service.get_tag_co_occurrence_by_mood(user_id, mood)
            return jsonify(data)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route('/analytics/advanced-correlations', methods=['GET'])
    @require_auth
    def get_advanced_correlations():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            data = analytics_service.get_advanced_correlations(user_id)
            return jsonify(data)
        except Exception as e:
            return secure_error_response(e, 500)

    @bp.route('/analytics/stability', methods=['GET'])
    @require_auth
    def get_stability():
        try:
            user_id = get_current_user_id()
            if user_id is None:
                return jsonify({"error": "Unauthorized"}), 401
            
            days = request.args.get("days", default=30, type=int)
            data = analytics_service.get_mood_stability(user_id, days)
            
            # Legacy mapping for frontend compatibility
            response = {
                "score": {
                    "score": data["stability_score"],
                    "count": data["sample_size"]
                },
                "trend": data["trend"]
            }
            return jsonify(response)
        except Exception as e:
            return secure_error_response(e, 500)

    return bp
