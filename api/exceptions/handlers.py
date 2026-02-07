"""Exception handlers for Flask application."""

import logging
from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from . import APIError
from api.validators import ValidationError as ValidatorValidationError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: Flask) -> None:
    """Register all exception handlers on the Flask app.

    Args:
        app: The Flask application instance
    """

    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        """Handle custom API errors."""
        logger.warning(
            "API error: %s (status=%d)", error.message, error.status_code
        )
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(ValidatorValidationError)
    def handle_validator_error(error: ValidatorValidationError):
        """Handle validation errors from the validators module."""
        logger.warning("Validation error: %s (field=%s)", error.message, error.field)
        response = {
            "status": "error",
            "error": error.message,
        }
        if error.field:
            response["details"] = {"field": error.field}
        return jsonify(response), 422

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        """Handle Werkzeug HTTP exceptions."""
        logger.warning("HTTP error: %s (status=%d)", error.description, error.code)
        return jsonify({
            "status": "error",
            "error": error.description or f"HTTP {error.code} Error",
        }), error.code

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found."""
        return jsonify({
            "status": "error",
            "error": "Resource not found",
        }), 404

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 Internal Server Error."""
        logger.exception("Internal server error: %s", error)
        return jsonify({
            "status": "error",
            "error": "An unexpected error occurred",
        }), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        """Handle any unexpected exceptions."""
        logger.exception("Unexpected error: %s", error)
        # Don't expose internal error details
        return jsonify({
            "status": "error",
            "error": "An unexpected error occurred",
        }), 500
