"""Base validation utilities."""

import re
from typing import Any, Optional


class ValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(message)


def validate_required(value: Any, field_name: str) -> None:
    """Validate that a required field is present and non-empty."""
    if value is None:
        raise ValidationError(f"{field_name} is required", field=field_name)
    if isinstance(value, str) and not value.strip():
        raise ValidationError(f"{field_name} cannot be empty", field=field_name)


def validate_date_format(value: str, field_name: str) -> None:
    """Validate that a string is in YYYY-MM-DD format."""
    if not value:
        raise ValidationError(f"{field_name} is required", field=field_name)

    pattern = r"^\d{4}-\d{2}-\d{2}$"
    if not re.match(pattern, value):
        raise ValidationError(
            f"{field_name} must be in YYYY-MM-DD format", field=field_name
        )

    # Validate the date components are valid
    try:
        year, month, day = map(int, value.split("-"))
        if not (1 <= month <= 12):
            raise ValidationError(f"{field_name} has invalid month", field=field_name)
        if not (1 <= day <= 31):
            raise ValidationError(f"{field_name} has invalid day", field=field_name)
    except ValueError:
        raise ValidationError(
            f"{field_name} must be in YYYY-MM-DD format", field=field_name
        )


def validate_integer_range(
    value: int, field_name: str, min_val: Optional[int] = None, max_val: Optional[int] = None
) -> None:
    """Validate that an integer is within a specified range."""
    if not isinstance(value, int):
        raise ValidationError(f"{field_name} must be an integer", field=field_name)

    if min_val is not None and value < min_val:
        raise ValidationError(
            f"{field_name} must be at least {min_val}", field=field_name
        )

    if max_val is not None and value > max_val:
        raise ValidationError(
            f"{field_name} must be at most {max_val}", field=field_name
        )


def validate_string_length(
    value: str, field_name: str, min_len: int = 0, max_len: Optional[int] = None
) -> None:
    """Validate that a string is within length limits."""
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a string", field=field_name)

    if len(value) < min_len:
        raise ValidationError(
            f"{field_name} must be at least {min_len} characters", field=field_name
        )

    if max_len is not None and len(value) > max_len:
        raise ValidationError(
            f"{field_name} must be at most {max_len} characters", field=field_name
        )


def validate_enum(value: Any, field_name: str, allowed_values: set) -> None:
    """Validate that a value is one of the allowed values."""
    if value not in allowed_values:
        allowed_str = ", ".join(str(v) for v in sorted(allowed_values))
        raise ValidationError(
            f"{field_name} must be one of: {allowed_str}", field=field_name
        )
