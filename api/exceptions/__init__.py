"""Custom exception classes for the API."""

from typing import Optional, Dict, Any


class APIError(Exception):
    """Base exception for all API errors."""

    status_code: int = 500
    message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: Optional[str] = None,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message or self.__class__.message
        self.status_code = status_code or self.__class__.status_code
        self.details = details
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to a JSON-serializable dict."""
        result = {"status": "error", "error": self.message}
        if self.details:
            result["details"] = self.details
        return result


class ValidationError(APIError):
    """Raised when input validation fails."""

    status_code = 422
    message = "Validation failed"

    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.field = field
        if field and not details:
            details = {"field": field}
        super().__init__(message=message, details=details)


class NotFoundError(APIError):
    """Raised when a requested resource is not found."""

    status_code = 404
    message = "Resource not found"

    def __init__(self, resource: str = "Resource", resource_id: Optional[Any] = None):
        details = None
        if resource_id is not None:
            details = {"resource_id": resource_id}
        super().__init__(message=f"{resource} not found", details=details)


class UnauthorizedError(APIError):
    """Raised when authentication is required but not provided or invalid."""

    status_code = 401
    message = "Authentication required"


class ForbiddenError(APIError):
    """Raised when the user lacks permission to perform an action."""

    status_code = 403
    message = "You do not have permission to perform this action"


class DatabaseError(APIError):
    """Raised when a database operation fails."""

    status_code = 500
    message = "A database error occurred"

    def __init__(self, message: str = "A database error occurred", original_error: Optional[Exception] = None):
        details = None
        if original_error:
            # Don't expose internal error details in production
            details = {"type": type(original_error).__name__}
        super().__init__(message=message, details=details)


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""

    status_code = 429
    message = "Rate limit exceeded. Please try again later."


class ConflictError(APIError):
    """Raised when there's a conflict with the current state."""

    status_code = 409
    message = "Conflict with current state"


__all__ = [
    "APIError",
    "ValidationError",
    "NotFoundError",
    "UnauthorizedError",
    "ForbiddenError",
    "DatabaseError",
    "RateLimitError",
    "ConflictError",
]
