"""Pydantic-style validation schemas for API inputs.

Using dataclasses with validation for lightweight validation without requiring pydantic.
"""

from dataclasses import dataclass, field
from typing import Optional, List
from .base import (
    ValidationError,
    validate_required,
    validate_date_format,
    validate_integer_range,
    validate_string_length,
    validate_enum,
)


@dataclass
class MoodEntryCreate:
    """Validation schema for creating a mood entry."""

    date: str
    mood: int
    content: str
    time: Optional[str] = None
    selected_options: Optional[List[int]] = None
    scale_values: Optional[dict] = None

    def __post_init__(self):
        validate_required(self.date, "date")
        validate_date_format(self.date, "date")
        validate_required(self.mood, "mood")
        validate_integer_range(self.mood, "mood", min_val=1, max_val=5)
        # Content can be empty but must be a string
        if self.content is None:
            self.content = ""


@dataclass
class MoodEntryUpdate:
    """Validation schema for updating a mood entry."""

    mood: Optional[int] = None
    content: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    selected_options: Optional[List[int]] = None
    scale_values: Optional[dict] = None

    def __post_init__(self):
        if self.mood is not None:
            validate_integer_range(self.mood, "mood", min_val=1, max_val=5)
        if self.date is not None:
            validate_date_format(self.date, "date")


@dataclass
class GoalCreate:
    """Validation schema for creating a goal."""

    title: str
    description: str = ""
    frequency_per_week: int = 1
    frequency_type: str = "weekly"
    target_count: int = 1
    custom_days: Optional[str] = None

    def __post_init__(self):
        validate_required(self.title, "title")
        validate_string_length(self.title, "title", min_len=1, max_len=200)
        validate_enum(
            self.frequency_type,
            "frequency_type",
            {"daily", "weekly", "monthly", "custom"},
        )
        if self.frequency_type == "weekly":
            validate_integer_range(
                self.frequency_per_week, "frequency_per_week", min_val=1, max_val=7
            )
        validate_integer_range(self.target_count, "target_count", min_val=1)


@dataclass
class GoalUpdate:
    """Validation schema for updating a goal."""

    title: Optional[str] = None
    description: Optional[str] = None
    frequency_per_week: Optional[int] = None
    frequency_type: Optional[str] = None
    target_count: Optional[int] = None
    custom_days: Optional[str] = None

    def __post_init__(self):
        if self.title is not None:
            validate_string_length(self.title, "title", min_len=1, max_len=200)
        if self.frequency_per_week is not None:
            validate_integer_range(
                self.frequency_per_week, "frequency_per_week", min_val=1, max_val=7
            )
        if self.frequency_type is not None:
            validate_enum(
                self.frequency_type,
                "frequency_type",
                {"daily", "weekly", "monthly", "custom"},
            )
        if self.target_count is not None:
            validate_integer_range(self.target_count, "target_count", min_val=1)


@dataclass
class ScaleCreate:
    """Validation schema for creating a scale definition."""

    name: str
    min_label: Optional[str] = None
    max_label: Optional[str] = None
    color_hex: Optional[str] = None

    def __post_init__(self):
        validate_required(self.name, "name")
        validate_string_length(self.name, "name", min_len=1, max_len=100)
        if self.color_hex is not None:
            # Basic hex color validation
            if not self.color_hex.startswith("#") or len(self.color_hex) not in (4, 7):
                raise ValidationError(
                    "color_hex must be a valid hex color (e.g., #fff or #ffffff)",
                    field="color_hex",
                )


@dataclass
class ScaleUpdate:
    """Validation schema for updating a scale definition."""

    name: Optional[str] = None
    min_label: Optional[str] = None
    max_label: Optional[str] = None
    color_hex: Optional[str] = None
    is_active: Optional[bool] = None

    def __post_init__(self):
        if self.name is not None:
            validate_string_length(self.name, "name", min_len=1, max_len=100)
        if self.color_hex is not None:
            if not self.color_hex.startswith("#") or len(self.color_hex) not in (4, 7):
                raise ValidationError(
                    "color_hex must be a valid hex color (e.g., #fff or #ffffff)",
                    field="color_hex",
                )


@dataclass
class ImportantDayCreate:
    """Validation schema for creating an important day."""

    title: str
    target_date: str
    category: str = "Custom"
    icon: str = "calendar"
    recurring_type: str = "once"
    remind_days_before: int = 1
    notes: Optional[str] = None

    def __post_init__(self):
        validate_required(self.title, "title")
        validate_string_length(self.title, "title", min_len=1, max_len=200)
        validate_required(self.target_date, "target_date")
        validate_date_format(self.target_date, "target_date")
        validate_enum(
            self.recurring_type,
            "recurring_type",
            {"once", "yearly", "monthly"},
        )
        validate_integer_range(
            self.remind_days_before, "remind_days_before", min_val=0, max_val=365
        )


@dataclass
class ImportantDayUpdate:
    """Validation schema for updating an important day."""

    title: Optional[str] = None
    target_date: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    recurring_type: Optional[str] = None
    remind_days_before: Optional[int] = None
    notes: Optional[str] = None

    def __post_init__(self):
        if self.title is not None:
            validate_string_length(self.title, "title", min_len=1, max_len=200)
        if self.target_date is not None:
            validate_date_format(self.target_date, "target_date")
        if self.recurring_type is not None:
            validate_enum(
                self.recurring_type,
                "recurring_type",
                {"once", "yearly", "monthly"},
            )
        if self.remind_days_before is not None:
            validate_integer_range(
                self.remind_days_before, "remind_days_before", min_val=0, max_val=365
            )
