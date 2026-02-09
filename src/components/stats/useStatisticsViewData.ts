import { useMemo, useState, useEffect } from 'react';
import apiService, { Scale, Correlation, CoOccurrence } from '../../services/api';
import { getWeeklyMoodData, movingAverage, WeeklyMoodDataPoint } from '../../utils/moodUtils';
import type { CalendarDay, MoodDistributionDataPoint, OverviewCard } from './statisticsTypes';
import { DEFAULT_METRICS, EMPTY_OBJECT } from './statisticsConstants';
import { buildCalendarDays, buildMoodDistributionData, buildOverviewCards } from './statisticsUtils';
import type { EntryWithSelections } from '../../types/entry';

// ========== Types ==========

interface Statistics {
  statistics?: {
    total_entries: number;
    average_mood: number;
  };
  mood_distribution?: Record<number, number>;
  current_streak?: number;
}

// Use shared EntryWithSelections type
type Entry = EntryWithSelections;

interface ScaleEntry {
  date: string;
  name: string;
  value: number;
}

interface AnalyticsData {
  correlations: Correlation[] | null;
  coOccurrence: CoOccurrence[];
  scales: Scale[];
  scaleEntries: ScaleEntry[];
  loading: boolean;
}

interface Activity {
  id: number;
  name: string;
  icon: string;
  count: number;
  average_mood: string;
  impact_score: number;
}

interface ActivityCorrelationsData {
  activities: Activity[];
  overall_average: number;
  scales: Scale[];
}

interface TrendChartDataPoint extends WeeklyMoodDataPoint {
  ma: number | null;
  dateLabel: string;
  [key: string]: unknown;
}

interface UseStatisticsViewDataReturn {
  hasStatistics: boolean;
  weeklyMoodData: WeeklyMoodDataPoint[];
  trendChartData: TrendChartDataPoint[];
  moodDistribution: Record<number, number> | Record<string, never>;
  moodDistributionData: MoodDistributionDataPoint[];
  activityCorrelations: ActivityCorrelationsData | null;
  frequentPairs: CoOccurrence[];
  calendarDays: CalendarDay[];
  overviewCards: OverviewCard[];
}

const useStatisticsViewData = (
  statistics: Statistics | null | undefined,
  pastEntries: Entry[],
  range: number
): UseStatisticsViewDataReturn => {
  const hasStatistics = Boolean(statistics);
  const metrics = statistics?.statistics ?? DEFAULT_METRICS;
  const currentStreak = statistics?.current_streak ?? 0;

  // Analytics Data State - Moved up to avoid reference errors
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    correlations: null,
    coOccurrence: [],
    scales: [],
    scaleEntries: [],
    loading: true
  });

  const moodDistribution = useMemo(
    () => statistics?.mood_distribution ?? EMPTY_OBJECT,
    [statistics?.mood_distribution],
  );

  const weeklyMoodData = useMemo(() => getWeeklyMoodData(pastEntries, range), [pastEntries, range]);

  const movingAverageSeries = useMemo(
    () => movingAverage(weeklyMoodData.map((d) => d.mood), 7),
    [weeklyMoodData],
  );

  const trendChartData = useMemo(
    (): TrendChartDataPoint[] => {
      // Create a map of weekday/formatted date -> scale values
      // scaleEntries have ISO dates, we need to convert to the same format as weeklyMoodData
      const scaleMap: Record<string, Record<string, number>> = {};
      (analyticsData.scaleEntries || []).forEach(entry => {
        // Convert ISO date to the same format as weeklyMoodData uses
        const entryDate = new Date(entry.date);
        const dateKey = range <= 7
          ? entryDate.toLocaleDateString('en-US', { weekday: 'short' })
          : entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!scaleMap[dateKey]) scaleMap[dateKey] = {};
        scaleMap[dateKey][entry.name] = entry.value;
      });

      return weeklyMoodData.map((point, index) => {
        // Find matching scale entries using the formatted date label
        const scaleValues = scaleMap[point.date] || {};

        return {
          ...point,
          ma: movingAverageSeries[index],
          ...scaleValues,
          dateLabel: point.date // Already formatted by getWeeklyMoodData
        };
      });
    },
    [weeklyMoodData, movingAverageSeries, analyticsData.scaleEntries, range],
  );

  const moodDistributionData = useMemo(
    () => buildMoodDistributionData(moodDistribution as Record<number, number>),
    [moodDistribution],
  );

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async (): Promise<void> => {
      try {
        // Single batch API call instead of 4 separate calls
        const data = await apiService.getAnalyticsBatch();

        if (mounted) {
          setAnalyticsData({
            correlations: data.correlations ?? null,
            coOccurrence: data.coOccurrence ?? [],
            scales: data.scales ?? [],
            scaleEntries: (data.scaleEntries ?? []) as unknown as ScaleEntry[],
            loading: false
          });
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
        if (mounted) {
          setAnalyticsData(prev => ({ ...prev, loading: false }));
        }
      }
    };
    fetchAnalytics();
    return () => { mounted = false; };
  }, [pastEntries]); // Refresh if entries change (simplest cache invalidation)

  // Build activity correlations data for ActivityCorrelations component
  const activityCorrelations = useMemo((): ActivityCorrelationsData | null => {
    const correlations = analyticsData.correlations;
    if (!correlations || correlations.length === 0) {
      return null;
    }

    const overallAvg = metrics.average_mood ?? 0;
    const activities: Activity[] = correlations.map((c, index) => {
      const avgMood = typeof c.average_mood === 'number' ? c.average_mood : 0;
      return {
        id: index,
        name: c.option_name,
        icon: '', // Icon not available in Correlation type
        count: c.count,
        average_mood: avgMood.toFixed(2),
        impact_score: parseFloat((avgMood - overallAvg).toFixed(1)),
      };
    });

    return {
      activities,
      overall_average: overallAvg,
      scales: analyticsData.scales,
    };
  }, [analyticsData.correlations, analyticsData.scales, metrics.average_mood]);

  const frequentPairs = analyticsData.coOccurrence;

  const calendarDays = useMemo(() => buildCalendarDays(pastEntries), [pastEntries]);

  const bestDayCount = useMemo(() => {
    const counts = Object.values(moodDistribution ?? {}) as number[];
    return counts.length ? Math.max(...counts) : 0;
  }, [moodDistribution]);

  const overviewCards = useMemo(
    () =>
      buildOverviewCards({
        totalEntries: metrics.total_entries ?? 0,
        averageMood: metrics.average_mood,
        currentStreak,
        bestDayCount,
      }),
    [metrics.total_entries, metrics.average_mood, currentStreak, bestDayCount],
  );

  return {
    hasStatistics,
    weeklyMoodData,
    trendChartData,
    moodDistribution,
    moodDistributionData,
    activityCorrelations,
    frequentPairs,
    calendarDays,
    overviewCards,
  };
};

export default useStatisticsViewData;
