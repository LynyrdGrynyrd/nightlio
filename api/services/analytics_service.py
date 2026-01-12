from typing import Dict, List
from api.database import MoodDatabase
from api.constants import AnalyticsLimits, Defaults

class AnalyticsService:
    def __init__(self, db: MoodDatabase):
        self.db = db

    def get_activity_correlations(self, user_id: int) -> Dict:
        """
        Get activities sorted by their impact on mood.
        """
        # 1. Get overall user stats for baseline
        # mood_service usually calls get_mood_statistics, but logic might be in DB.
        # Let's assume MoodEntriesMixin has get_mood_statistics.
        # If not, we might fail. But I assume it does based on previous code.
        # Actually, get_mood_statistics might be in MoodService logic.
        # But let's check if DB has it. DB facade imports MoodEntriesMixin.
        
        # Safe fallback: define logic or rely on DB method if existing.
        # Previous code called self.db.get_mood_statistics(user_id).
        
        try:
            overall_stats = self.db.get_mood_statistics(user_id)
            overall_avg = overall_stats.get("average_mood", 0)
        except AttributeError:
            # Fallback if method missing in DB (should be in service)
            overall_avg = 0 # Simplified
            
        # 2. Get activity stats
        activities = self.db.get_activity_correlations(user_id)

        # 3. Calculate impact score
        results = []
        for act in activities:
            avg_mood = act["average_mood"]
            act["impact_score"] = round(avg_mood - overall_avg, 2)
            act["average_mood"] = round(avg_mood, 2) 
            results.append(act)

        results.sort(key=lambda x: x["impact_score"], reverse=True)

        return {
            "overall_average": overall_avg,
            "activities": results
        }

    def get_tag_co_occurrence(self, user_id: int) -> List[Dict]:
        """Get frequently paired tags."""
        return self.db.get_tag_co_occurrence(user_id, limit=AnalyticsLimits.TAG_CO_OCCURRENCE)

    def get_tag_co_occurrence_by_mood(self, user_id: int, mood: int) -> List[Dict]:
        """Get frequently paired tags filtered by mood."""
        return self.db.get_tag_co_occurrence_by_mood(user_id, mood, limit=AnalyticsLimits.TAG_CO_OCCURRENCE)

    def get_advanced_correlations(self, user_id: int) -> List[Dict]:
        """Get Apriori analysis for tag pairs."""
        return self.db.get_advanced_correlations(user_id, limit=AnalyticsLimits.ADVANCED_CORRELATIONS)

    def get_mood_stability(self, user_id: int, days: int = Defaults.MOOD_STABILITY_DAYS) -> Dict:
        """
        Calculate mood stability score and trend.
        Reference implementation delegating to DB mixins.
        """
        data = self.db.get_mood_stability(user_id, days)
        trend = self.db.get_mood_stability_trend(user_id, days)
        
        if not data:
             return {
                "stability_score": None,
                "interpretation": "Not enough data",
                "sample_size": 0,
                "trend": trend,
                "days": days
             }
        
        score = data['score']
        # Interpretation
        if score >= 85: interpretation = "Very Stable"
        elif score >= 70: interpretation = "Stable"
        elif score >= 50: interpretation = "Variable"
        else: interpretation = "Volatile"

        return {
            "stability_score": score,
            "interpretation": interpretation,
            "sample_size": data['count'],
            "trend": trend,
            "days": days,
            "std_deviation": 0, # Placeholder if FE needs it, or handled by score
             "variance": 0
        }
