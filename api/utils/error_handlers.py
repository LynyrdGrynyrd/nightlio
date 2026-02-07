from flask import jsonify
import logging

from api.exceptions import APIError
from api.validators import ValidationError

logger = logging.getLogger(__name__)


def setup_error_handlers(app):
    """Setup global error handlers for the Flask app"""

    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        """Handle custom API errors."""
        logger.warning(
            "API error: %s (status=%d)", error.message, error.status_code
        )
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError):
        """Handle validation errors from the validators module."""
        logger.warning("Validation error: %s (field=%s)", error.message, error.field)
        response = {
            "status": "error",
            "error": error.message,
        }
        if error.field:
            response["details"] = {"field": error.field}
        return jsonify(response), 422

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"status": "error", "error": "Bad request"}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"status": "error", "error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({"status": "error", "error": "Internal server error"}), 500

    @app.errorhandler(ValueError)
    def value_error(error):
        # SECURITY: Log error details internally but don't expose to client
        logger.warning(f"ValueError caught: {error}")
        return jsonify({"status": "error", "error": "Invalid input provided"}), 400

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        """Handle any unexpected exceptions."""
        logger.exception("Unexpected error: %s", error)
        # Don't expose internal error details
        return jsonify({
            "status": "error",
            "error": "An unexpected error occurred",
        }), 500

    return app
