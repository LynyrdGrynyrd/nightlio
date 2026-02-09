"""Tests for password and username validation utilities."""

from api.utils.password_validation import (
    get_strength_label,
    validate_password_strength,
    validate_username,
)


class TestValidatePasswordStrength:
    def test_strong_password(self):
        result = validate_password_strength("StrongPass1!")
        assert result["valid"] is True
        assert result["errors"] == []
        assert result["score"] >= 4

    def test_too_short(self):
        result = validate_password_strength("Aa1!")
        assert result["valid"] is False
        assert any("8 characters" in e for e in result["errors"])

    def test_missing_uppercase(self):
        result = validate_password_strength("lowercase1!")
        assert result["valid"] is False
        assert any("uppercase" in e for e in result["errors"])

    def test_missing_lowercase(self):
        result = validate_password_strength("UPPERCASE1!")
        assert result["valid"] is False
        assert any("lowercase" in e for e in result["errors"])

    def test_missing_number(self):
        result = validate_password_strength("NoNumbers!")
        assert result["valid"] is False
        assert any("number" in e for e in result["errors"])

    def test_special_char_adds_score(self):
        without = validate_password_strength("StrongPass1")
        with_special = validate_password_strength("StrongPass1!")
        assert with_special["score"] > without["score"]

    def test_long_password_bonus(self):
        short = validate_password_strength("Str0ng!A")
        long = validate_password_strength("Str0ng!Abcdefg")
        assert long["score"] >= short["score"]

    def test_score_capped_at_5(self):
        result = validate_password_strength("VeryLongStrongP@ss1word!")
        assert result["score"] <= 5


class TestGetStrengthLabel:
    def test_labels(self):
        assert get_strength_label(0) == "Very Weak"
        assert get_strength_label(1) == "Very Weak"
        assert get_strength_label(2) == "Weak"
        assert get_strength_label(3) == "Fair"
        assert get_strength_label(4) == "Strong"
        assert get_strength_label(5) == "Very Strong"


class TestValidateUsername:
    def test_valid_username(self):
        result = validate_username("test_user")
        assert result["valid"] is True
        assert result["errors"] == []

    def test_too_short(self):
        result = validate_username("ab")
        assert result["valid"] is False
        assert any("3 characters" in e for e in result["errors"])

    def test_too_long(self):
        result = validate_username("a" * 31)
        assert result["valid"] is False
        assert any("30 characters" in e for e in result["errors"])

    def test_invalid_characters(self):
        result = validate_username("user@name")
        assert result["valid"] is False
        assert any("letters, numbers, and underscores" in e for e in result["errors"])

    def test_starts_with_number(self):
        result = validate_username("1username")
        assert result["valid"] is False
        assert any("cannot start with a number" in e for e in result["errors"])

    def test_alphanumeric_and_underscores_ok(self):
        result = validate_username("User_Name_123")
        assert result["valid"] is True
