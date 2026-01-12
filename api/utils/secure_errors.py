"""Secure error response utilities.

SECURITY: These helpers ensure that internal error details are logged
but not exposed to API clients, preventing information leakage.
"""

import logging
from flask import jsonify
from typing import Tuple, Any

logger = logging.getLogger(__name__)


def secure_error_response(
    error: Exception,
    status_code: int = 500,
    log_level: str = "error"
) -> Tuple[Any, int]:
    """Return a secure JSON error response without exposing exception details.
    
    Args:
        error: The exception that was caught
        status_code: HTTP status code to return (default: 500)
        log_level: Logging level - 'error', 'warning', or 'info'
    
    Returns:
        Tuple of (JSON response, status code)
    """
    # Log the actual error for debugging
    log_func = getattr(logger, log_level, logger.error)
    log_func(f"API error (status {status_code}): {error}")
    
    # Return generic messages based on status code
    messages = {
        400: "Invalid request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Resource not found",
        500: "An internal error occurred",
    }
    
    message = messages.get(status_code, "An error occurred")
    return jsonify({"error": message}), status_code
