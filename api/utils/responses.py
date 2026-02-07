"""Standardized API response utilities."""

from typing import Any, Dict, List, Optional, Union
from flask import jsonify


def success_response(
    data: Any = None,
    message: Optional[str] = None,
    status: int = 200
) -> tuple:
    """Create a standardized success response.

    Args:
        data: The response data (can be any JSON-serializable type)
        message: Optional success message
        status: HTTP status code (default 200)

    Returns:
        Tuple of (jsonify response, status code)
    """
    response = {"status": "success"}
    if data is not None:
        response["data"] = data
    if message is not None:
        response["message"] = message
    return jsonify(response), status


def error_response(
    error: str,
    details: Optional[Union[str, List[str], Dict[str, Any]]] = None,
    status: int = 400
) -> tuple:
    """Create a standardized error response.

    Args:
        error: The main error message
        details: Optional additional error details
        status: HTTP status code (default 400)

    Returns:
        Tuple of (jsonify response, status code)
    """
    response = {"status": "error", "error": error}
    if details is not None:
        response["details"] = details
    return jsonify(response), status


def paginated_response(
    data: List[Any],
    total: int,
    page: int,
    per_page: int,
    status: int = 200
) -> tuple:
    """Create a standardized paginated response.

    Args:
        data: The list of items for the current page
        total: Total number of items across all pages
        page: Current page number (1-indexed)
        per_page: Number of items per page
        status: HTTP status code (default 200)

    Returns:
        Tuple of (jsonify response, status code)
    """
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    has_next = page < total_pages
    has_prev = page > 1

    response = {
        "status": "success",
        "data": data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
        }
    }
    return jsonify(response), status


def validation_error_response(
    errors: Union[str, List[str], Dict[str, str]],
    status: int = 422
) -> tuple:
    """Create a standardized validation error response.

    Args:
        errors: Validation error(s) - can be string, list of strings, or dict
        status: HTTP status code (default 422 Unprocessable Entity)

    Returns:
        Tuple of (jsonify response, status code)
    """
    return error_response("Validation failed", details=errors, status=status)


def not_found_response(resource: str = "Resource") -> tuple:
    """Create a standardized 404 not found response.

    Args:
        resource: Name of the resource that wasn't found

    Returns:
        Tuple of (jsonify response, 404 status code)
    """
    return error_response(f"{resource} not found", status=404)


def unauthorized_response(message: str = "Unauthorized") -> tuple:
    """Create a standardized 401 unauthorized response.

    Args:
        message: The unauthorized message

    Returns:
        Tuple of (jsonify response, 401 status code)
    """
    return error_response(message, status=401)


def forbidden_response(message: str = "Forbidden") -> tuple:
    """Create a standardized 403 forbidden response.

    Args:
        message: The forbidden message

    Returns:
        Tuple of (jsonify response, 403 status code)
    """
    return error_response(message, status=403)
