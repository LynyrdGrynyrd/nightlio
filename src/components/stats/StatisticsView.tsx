import { useCallback, useRef, useState, memo, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { exportSVGToPNG, exportDataToCSV } from '../../utils/exportUtils';
import useStatisticsViewData from './useStatisticsViewData';
import ScaleTrendChart from './ScaleTrendChart';
import YearInPixels from './YearInPixels';
import ActivityCorrelations from './ActivityCorrelations';
import FrequentlyTogether from './FrequentlyTogether';
import StreakChain from './StreakChain';
import MoodStability from './MoodStability';
import ImportantDaysList from '../ImportantDays/ImportantDaysList';
import { RANGE_OPTIONS, resolveCSSVar } from './statisticsConstants';
import { useTheme } from '../../contexts/ThemeContext';
import type { EntryWithSelections } from '../../types/entry';
import {
  MoodTrendSection,
  DistributionSection,
  MoodCalendarSection,
  StatisticsOverviewGrid,
  LoadingState,
  ErrorState,
  EmptyState,
} from './charts';

type Entry = EntryWithSelections;

interface Statistics {
  statistics?: {
    total_entries: number;
    average_mood: number;
  };
  mood_distribution?: Record<number, number>;
  current_streak?: number;
}

interface StatisticsViewProps {
  statistics: Statistics | null;
  pastEntries: Entry[];
  loading: boolean;
  error?: string;
  onDayClick?: (date: string) => void;
  onEntryClick?: (entry: Entry) => void;
}

const StatisticsView = ({ statistics, pastEntries, loading, error, onDayClick, onEntryClick }: StatisticsViewProps) => {
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const trendRef = useRef<HTMLDivElement>(null);
  const distributionRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Resolve CSS variables for SVG chart compatibility (re-computes on theme change)
  const chartColors = useMemo(() => ({
    tickFill: resolveCSSVar('var(--muted-foreground)'),
    border: resolveCSSVar('var(--border)'),
    moods: {
      1: resolveCSSVar('var(--mood-1)'),
      2: resolveCSSVar('var(--mood-2)'),
      3: resolveCSSVar('var(--mood-3)'),
      4: resolveCSSVar('var(--mood-4)'),
      5: resolveCSSVar('var(--mood-5)'),
    } as Record<number, string>,
  }), [theme]);

  const {
    hasStatistics,
    weeklyMoodData,
    trendChartData,
    moodDistributionData,
    activityCorrelations,
    frequentPairs,
    calendarDays,
    overviewCards,
  } = useStatisticsViewData(statistics, pastEntries, range);

  // Use refs to avoid non-primitive dependencies in callbacks
  const weeklyMoodDataRef = useRef(weeklyMoodData);
  const moodDistributionDataRef = useRef(moodDistributionData);
  useEffect(() => { weeklyMoodDataRef.current = weeklyMoodData; }, [weeklyMoodData]);
  useEffect(() => { moodDistributionDataRef.current = moodDistributionData; }, [moodDistributionData]);

  const handleExportTrendPNG = useCallback(() => {
    const svg = trendRef.current?.querySelector('svg');
    if (svg) {
      exportSVGToPNG(svg, `mood-trend-${range}d.png`);
    }
  }, [range]);

  const handleExportTrendCSV = useCallback(() => {
    exportDataToCSV(weeklyMoodDataRef.current, ['date', 'mood'], `mood-trend-${range}d.csv`);
  }, [range]);

  const handleExportDistributionPNG = useCallback(() => {
    const svg = distributionRef.current?.querySelector('svg');
    if (svg) {
      exportSVGToPNG(svg, 'mood-distribution.png');
    }
  }, []);

  const handleExportDistributionCSV = useCallback(() => {
    const rows = moodDistributionDataRef.current.map(({ label, count }) => ({ mood: label, count }));
    exportDataToCSV(rows, ['mood', 'count'], 'mood-distribution.csv');
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!hasStatistics) return <EmptyState />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div data-testid="stats-desktop-layout" className="xl:grid xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)] xl:gap-6 xl:items-start space-y-6 xl:space-y-0">
        <div className="space-y-6 min-w-0">
          <MoodTrendSection
            chartData={trendChartData}
            range={range}
            onChangeRange={setRange}
            onExportPNG={handleExportTrendPNG}
            onExportCSV={handleExportTrendCSV}
            containerRef={trendRef}
            tickFillColor={chartColors.tickFill}
            borderColor={chartColors.border}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Scale Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ScaleTrendChart data={trendChartData as unknown as { dateLabel: string;[key: string]: string | number }[]} scales={activityCorrelations?.scales || []} />
            </CardContent>
          </Card>

          <DistributionSection
            chartData={moodDistributionData}
            onExportPNG={handleExportDistributionPNG}
            onExportCSV={handleExportDistributionCSV}
            containerRef={distributionRef}
            tickFillColor={chartColors.tickFill}
            borderColor={chartColors.border}
          />

          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-6 mt-4">
              <ActivityCorrelations data={activityCorrelations} />
              <FrequentlyTogether data={frequentPairs} />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6 mt-4">
              <YearInPixels entries={pastEntries} onDayClick={onDayClick} />
              <MoodCalendarSection days={calendarDays} onDayClick={onDayClick} onEntryClick={onEntryClick} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <StreakChain />
          <StatisticsOverviewGrid cards={overviewCards} className="md:grid-cols-2 xl:grid-cols-2" />
          <MoodStability />
          <ImportantDaysList />
        </aside>
      </div>
    </div>
  );
};

export default memo(StatisticsView);
