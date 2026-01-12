import { useMemo, useState, useEffect } from 'react';
import apiService from '../../services/api';
import { getWeeklyMoodData, movingAverage } from '../../utils/moodUtils';
import {
  DEFAULT_METRICS,
  EMPTY_OBJECT,
  buildCalendarDays,
  buildMoodDistributionData,
  buildOverviewCards,
} from './statisticsViewUtils';

const useStatisticsViewData = (statistics, pastEntries, range) => {
  const hasStatistics = Boolean(statistics);
  const metrics = statistics?.statistics ?? DEFAULT_METRICS;
  const currentStreak = statistics?.current_streak ?? 0;

  // Analytics Data State - Moved up to avoid reference errors
  const [analyticsData, setAnalyticsData] = useState({
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
    () => {
      // Create a map of date -> scale values keys
      const scaleMap = {};
      (analyticsData.scaleEntries || []).forEach(entry => {
        const dateKey = entry.date;
        if (!scaleMap[dateKey]) scaleMap[dateKey] = {};
        scaleMap[dateKey][entry.name] = entry.value;
      });

      return weeklyMoodData.map((point, index) => {
        // Find matching scale entries for this date
        const scaleValues = scaleMap[point.date] || {};

        return {
          ...point,
          ma: movingAverageSeries[index],
          ...scaleValues,
          dateLabel: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        };
      });
    },
    [weeklyMoodData, movingAverageSeries, analyticsData.scaleEntries],
  );

  const moodDistributionData = useMemo(
    () => buildMoodDistributionData(moodDistribution),
    [moodDistribution],
  );

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      try {
        const [correlations, coOccurrence, scales, scaleEntries] = await Promise.all([
          apiService.getAnalyticsCorrelations().catch(() => null),
          apiService.getAnalyticsCoOccurrence().catch(() => []),
          apiService.getScales().catch(() => []),
          apiService.getScaleEntries().catch(() => [])
        ]);

        if (mounted) {
          setAnalyticsData({
            correlations,
            coOccurrence: coOccurrence || [],
            scales: scales || [],
            scaleEntries: scaleEntries || [],
            loading: false
          });
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      }
    };
    fetchAnalytics();
    return () => { mounted = false; };
  }, [pastEntries]); // Refresh if entries change (simplest cache invalidation)

  // Computed views (still needed for charts)
  const tagStats = {
    ...analyticsData.correlations,
    scales: analyticsData.scales
  };
  const frequentPairs = analyticsData.coOccurrence;

  const calendarDays = useMemo(() => buildCalendarDays(pastEntries), [pastEntries]);

  const bestDayCount = useMemo(() => {
    const counts = Object.values(moodDistribution ?? {});
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
    tagStats,
    frequentPairs,
    calendarDays,
    overviewCards,
  };
};

export default useStatisticsViewData;
