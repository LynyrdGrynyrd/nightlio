"""Service layer for custom mood definitions."""

from typing import Dict, List, Optional
from api.database import MoodDatabase


class MoodDefinitionService:
    """Business logic for user-customizable mood definitions."""

    def __init__(self, db: MoodDatabase):
        self._db = db

    def get_user_mood_definitions(self, user_id: int) -> List[Dict]:
        """Get mood definitions for a user, creating defaults if none exist."""
        return self._db.get_user_mood_definitions(user_id)

    def update_mood_definition(
        self,
        user_id: int,
        score: int,
        label: Optional[str] = None,
        icon: Optional[str] = None,
        color_hex: Optional[str] = None,
    ) -> Optional[Dict]:
        """Update a specific mood definition for a user.

        Args:
            user_id: The user's ID
            score: The mood score (1-5) to update
            label: Optional new label
            icon: Optional new icon (emoji)
            color_hex: Optional new color (hex format)

        Returns:
            The updated mood definition, or None if no changes were made
        """
        # Validate score
        if not 1 <= score <= 5:
            raise ValueError("Score must be between 1 and 5")

        # Validate color_hex format if provided
        if color_hex is not None:
            if not color_hex.startswith("#") or len(color_hex) not in (4, 7):
                raise ValueError("color_hex must be a valid hex color (e.g., #fff or #ffffff)")

        return self._db.update_mood_definition(
            user_id=user_id,
            score=score,
            label=label,
            icon=icon,
            color_hex=color_hex,
        )

    def reset_to_defaults(self, user_id: int) -> List[Dict]:
        """Reset user's mood definitions to defaults.

        This could be implemented by deleting existing definitions
        and letting get_user_mood_definitions recreate them.
        """
        # For now, just return current definitions
        # A full implementation would delete and recreate
        return self.get_user_mood_definitions(user_id)
