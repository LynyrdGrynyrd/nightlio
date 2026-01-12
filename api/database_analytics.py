"""Analytics and insights database mixin."""

from __future__ import annotations

import sqlite3
from typing import Dict, List, Optional

try:  # pragma: no cover
    from .database_common import DatabaseConnectionMixin
except ImportError:  # pragma: no cover
    from database_common import DatabaseConnectionMixin  # type: ignore


class AnalyticsMixin(DatabaseConnectionMixin):
    """Refined analytics queries for insights."""

    def get_activity_correlations(self, user_id: int) -> List[Dict]:
        """
        Calculate average mood and frequency for each activity (option).
        Returns a list of dicts with id, name, icon, count, average_mood.
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT
                    go.id,
                    go.name,
                    go.icon,
                    COUNT(me.id) as count,
                    AVG(me.mood) as average_mood
                FROM group_options go
                JOIN entry_selections es ON go.id = es.option_id
                JOIN mood_entries me ON es.entry_id = me.id
                WHERE me.user_id = ?
                GROUP BY go.id
                HAVING count >= 3 -- Only showing significantly used tags
                ORDER BY average_mood DESC
                """,
                (user_id,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_tag_co_occurrence(self, user_id: int, limit: int = 10) -> List[Dict]:
        """
        Find pairs of tags that appear together in the same entry.
        Returns a list of pairs with frequency.
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT
                    op1.id as option1_id,
                    op1.name as option1_name,
                    op1.icon as option1_icon,
                    op2.id as option2_id,
                    op2.name as option2_name,
                    op2.icon as option2_icon,
                    COUNT(*) as frequency
                FROM entry_selections es1
                JOIN entry_selections es2 
                    ON es1.entry_id = es2.entry_id 
                    AND es1.option_id < es2.option_id
                JOIN mood_entries me ON es1.entry_id = me.id
                JOIN group_options op1 ON es1.option_id = op1.id
                JOIN group_options op2 ON es2.option_id = op2.id
                WHERE me.user_id = ?
                GROUP BY es1.option_id, es2.option_id
                ORDER BY frequency DESC
                LIMIT ?
                """,
                (user_id, limit),
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_tag_co_occurrence_by_mood(
        self, user_id: int, mood: int, limit: int = 10
    ) -> List[Dict]:
        """
        Find pairs of tags that appear together in entries with a specific mood.
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT
                    op1.id as option1_id,
                    op1.name as option1_name,
                    op1.icon as option1_icon,
                    op2.id as option2_id,
                    op2.name as option2_name,
                    op2.icon as option2_icon,
                    COUNT(*) as frequency
                FROM entry_selections es1
                JOIN entry_selections es2 
                    ON es1.entry_id = es2.entry_id 
                    AND es1.option_id < es2.option_id
                JOIN mood_entries me ON es1.entry_id = me.id
                JOIN group_options op1 ON es1.option_id = op1.id
                JOIN group_options op2 ON es2.option_id = op2.id
                WHERE me.user_id = ? AND me.mood = ?
                GROUP BY es1.option_id, es2.option_id
                ORDER BY frequency DESC
                LIMIT ?
                """,
                (user_id, mood, limit),
            )
            return [dict(row) for row in cursor.fetchall()]



    def get_advanced_correlations(self, user_id: int, days: int = 180, limit: int = 50) -> List[Dict]:
        """
        Calculate Apriori metrics (Support, Confidence, Lift) for tag pairs.
        Defaults to last 180 days to prevent O(N^2) performance issues on full table scans.
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            # We need to pass user_id multiple times for the subqueries
            cursor = conn.execute(
                """
                WITH 
                  Total AS (
                    SELECT COUNT(*) as N 
                    FROM mood_entries 
                    WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
                  ),
                  TagCounts AS (
                    SELECT option_id, COUNT(*) as cnt 
                    FROM entry_selections es 
                    JOIN mood_entries me ON es.entry_id = me.id 
                    WHERE me.user_id = ? AND me.date >= date('now', '-' || ? || ' days')
                    GROUP BY option_id
                  ),
                  Pairs AS (
                    SELECT 
                      es1.option_id as id1, es2.option_id as id2, COUNT(*) as pair_cnt
                    FROM entry_selections es1
                    JOIN entry_selections es2 ON es1.entry_id = es2.entry_id AND es1.option_id < es2.option_id
                    JOIN mood_entries me ON es1.entry_id = me.id
                    WHERE me.user_id = ? AND me.date >= date('now', '-' || ? || ' days')
                    GROUP BY es1.option_id, es2.option_id
                  )
                SELECT 
                    p.id1 as option1_id, op1.name as option1_name, op1.icon as option1_icon,
                    p.id2 as option2_id, op2.name as option2_name, op2.icon as option2_icon,
                    p.pair_cnt as frequency,
                    CAST(p.pair_cnt AS FLOAT) / tc1.cnt as confidence_1_to_2,
                    CAST(p.pair_cnt AS FLOAT) / tc2.cnt as confidence_2_to_1,
                    (CAST(p.pair_cnt AS FLOAT) * (SELECT N FROM Total)) / (tc1.cnt * tc2.cnt) as lift,
                    (CAST(p.pair_cnt AS FLOAT) / (SELECT N FROM Total)) as support
                FROM Pairs p
                JOIN TagCounts tc1 ON p.id1 = tc1.option_id
                JOIN TagCounts tc2 ON p.id2 = tc2.option_id
                JOIN group_options op1 ON p.id1 = op1.id
                JOIN group_options op2 ON p.id2 = op2.id
                JOIN Total
                WHERE p.pair_cnt >= 3 -- Min support count filter
                ORDER BY lift DESC
                LIMIT ?
                """,
                (user_id, days, user_id, days, user_id, days, limit),
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_mood_stability(self, user_id: int, days: int = 30) -> Optional[float]:
        """
        Calculate mood stability score (0-100) based on standard deviation.
        Higher is more stable.
        """
        with self._connect() as conn:
            cursor = conn.execute(
                """
                SELECT mood
                FROM mood_entries
                WHERE user_id = ?
                  AND date >= date('now', '-' || ? || ' days')
                ORDER BY date
                """,
                (user_id, days),
            )
            moods = [row[0] for row in cursor.fetchall()]
            
            if len(moods) < 2:
                return None
                
            # Calculate Standard Deviation
            avg = sum(moods) / len(moods)
            variance = sum((x - avg) ** 2 for x in moods) / len(moods)
            std_dev = variance ** 0.5
            
            # Map std_dev (approx 0-2.5) to 0-100 score
            score = max(0, 100 - (std_dev * 40))
            return {'score': int(score), 'count': len(moods)}

    def get_mood_stability_trend(self, user_id: int, days: int = 30) -> List[Dict]:
        """
        Calculate daily stability score for the trend line.
        """
        window_size = 7 # Rolling window
        
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT date, mood
                FROM mood_entries
                WHERE user_id = ?
                  AND date >= date('now', '-' || ? || ' days')
                ORDER BY date ASC
                """,
                (user_id, days + window_size),
            )
            rows = cursor.fetchall()
            
        entries = [{'date': r['date'], 'mood': r['mood']} for r in rows]
        
        from datetime import date, timedelta
        
        trend = []
        today = date.today()
        start_date = today - timedelta(days=days)
        
        current = start_date
        while current <= today:
            d_str = current.isoformat()
            
            # Get moods in window [current - window_size, current]
            window_start = (current - timedelta(days=window_size)).isoformat()
            
            window_moods = [
                e['mood'] for e in entries 
                if window_start <= e['date'] <= d_str
            ]
            
            if len(window_moods) >= 2:
                avg = sum(window_moods) / len(window_moods)
                variance = sum((x - avg) ** 2 for x in window_moods) / len(window_moods)
                std_dev = variance ** 0.5
                score = max(0, 100 - (std_dev * 40))
                trend.append({'date': d_str, 'score': int(score)})
            else:
                trend.append({'date': d_str, 'score': None})
                
            current += timedelta(days=1)
            
        return trend
