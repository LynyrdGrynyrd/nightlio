"""Password validation utilities."""

from __future__ import annotations

import re
from typing import Dict, List


def validate_password_strength(password: str) -> Dict[str, any]:
    """
    Validate password strength and return detailed feedback.

    Args:
        password: The password to validate

    Returns:
        Dict with:
            - valid: bool - Whether password meets all requirements
            - errors: List[str] - List of validation errors
            - score: int - Password strength score (0-5)
    """
    errors: List[str] = []
    score = 0

    # Check minimum length
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    else:
        score += 1

    # Check for uppercase letter
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    else:
        score += 1

    # Check for lowercase letter
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    else:
        score += 1

    # Check for number
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number")
    else:
        score += 1

    # Check for special character (optional but recommended)
    if re.search(r'[^A-Za-z0-9]', password):
        score += 1

    # Bonus for length
    if len(password) >= 12:
        score = min(score + 1, 5)

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "score": score,
        "strength": get_strength_label(score)
    }


def get_strength_label(score: int) -> str:
    """Get a human-readable strength label for a password score."""
    if score <= 1:
        return "Very Weak"
    elif score == 2:
        return "Weak"
    elif score == 3:
        return "Fair"
    elif score == 4:
        return "Strong"
    else:
        return "Very Strong"


def validate_username(username: str) -> Dict[str, any]:
    """
    Validate username format.

    Args:
        username: The username to validate

    Returns:
        Dict with valid (bool) and errors (List[str])
    """
    errors: List[str] = []

    # Check length
    if len(username) < 3:
        errors.append("Username must be at least 3 characters long")
    elif len(username) > 30:
        errors.append("Username must be 30 characters or less")

    # Check format (alphanumeric and underscores only)
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        errors.append("Username can only contain letters, numbers, and underscores")

    # Check doesn't start with number
    if username and username[0].isdigit():
        errors.append("Username cannot start with a number")

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


__all__ = ["validate_password_strength", "validate_username", "get_strength_label"]
