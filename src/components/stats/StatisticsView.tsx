import React, { useCallback, useRef, useState, memo, useMemo, useEffect, KeyboardEvent } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { LucideIcon } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import {
  RANGE_OPTIONS,
  TOOLTIP_STYLE,
  MOOD_LEGEND,
  MOOD_SHORTHANDS,
  WEEK_DAYS,
  formatTrendTooltip,
  getMoodColor,
  resolveCSSVar,
  CalendarDay,
} from './statisticsViewUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Download, Share } from 'lucide-react';
import type { EntryWithSelections } from '../../types/entry';

// Chart margin constant to avoid inline object re-creation
const CHART_MARGIN = { top: 20, right: 10, left: -20, bottom: 0 };

// Recharts dot component props
interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { mood?: number | null };
}

// Custom dot component that colors each point based on its mood value
const MoodDot = memo((props: DotProps) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.mood === null || payload.mood === undefined) return null;
  if (cx === undefined || cy === undefined) return null;
  const color = getMoodColor(payload.mood);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="var(--card)"
      strokeWidth={2}
    />
  );
});

// Active dot (on hover) with larger size
const MoodActiveDot = memo((props: DotProps) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.mood === null || payload.mood === undefined) return null;
  if (cx === undefined || cy === undefined) return null;
  const color = getMoodColor(payload.mood);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={8}
      fill={color}
      stroke="var(--card)"
      strokeWidth={2}
    />
  );
});

// ========== Types & Interfaces ==========

interface OverviewCard {
  key: string;
  value: string | number;
  label: string;
  tone?: 'danger' | string;
}

interface MoodLegendItem {
  value: number;
  icon: LucideIcon;
  color: string;
  label: string;
}

interface ChartDataPoint {
  date: string;
  mood: number | null;
  ma?: number | null;
  dateLabel?: string;
  [key: string]: unknown;
}

interface DistributionDataPoint {
  key: string | number;
  mood: string;
  label: string;
  count: number;
  fill: string;
}

// Use shared EntryWithSelections type
type Entry = EntryWithSelections;

// Extended CalendarDay for filtered display
interface FilteredCalendarDay extends CalendarDay {
  dimmed?: boolean;
}

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

// ========== Sub-components ==========

const MoodLegend = memo(({ resolvedColors }: { resolvedColors?: Record<number, string> }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
    {MOOD_LEGEND.map(({ value, icon: Icon, color, label }: MoodLegendItem) => (
      <div key={value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon size={14} style={{ color: resolvedColors?.[value] || resolveCSSVar(color) }} />
        <span>{label}</span>
      </div>
    ))}
  </div>
));

const StatisticsOverviewGrid = memo(({ cards, className }: { cards: OverviewCard[]; className?: string }) => (
  <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4", className)}>
    {cards.map(({ key, value, label, tone }) => (
      <Card key={key}>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className={cn(
            "text-3xl font-bold mb-1 tabular-nums",
            tone === 'danger' ? "text-destructive" : "text-foreground"
          )}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
));

const RangeSelector = memo(({ range, onChange }: { range: number; onChange: (range: number) => void }) => (
  <div className="flex gap-1 bg-muted p-1 rounded-lg" role="group" aria-label="Select date range">
    {RANGE_OPTIONS.map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => onChange(option)}
        aria-pressed={range === option}
        aria-label={`Show last ${option} days`}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-md transition-colors",
          range === option
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {option}d
      </button>
    ))}
  </div>
));

const MoodTrendSection = memo(({ chartData, range, onChangeRange, onExportPNG, onExportCSV, containerRef, tickFillColor, borderColor }: {
  chartData: ChartDataPoint[];
  range: number;
  onChangeRange: (range: number) => void;
  onExportPNG: () => void;
  onExportCSV: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tickFillColor: string;
  borderColor: string;
}) => (
  <Card ref={containerRef} id="mood-trend">
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
      <CardTitle className="text-base font-semibold">Mood Trend</CardTitle>
      <div className="flex flex-wrap items-center gap-2">
        <RangeSelector range={range} onChange={onChangeRange} />
        <Button variant="ghost" size="icon" onClick={onExportPNG} aria-label="Export mood trend as PNG">
          <Share size={16} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onExportCSV} aria-label="Export mood trend as CSV">
          <Download size={16} aria-hidden="true" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.5} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: tickFillColor }}
              axisLine={{ stroke: borderColor }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: tickFillColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => MOOD_SHORTHANDS[value as number] || ''}
              width={30}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name, props) => formatTrendTooltip(value as number | null | undefined, name as string, props as { dataKey?: string })}
              cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.2 }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke={resolveCSSVar('var(--muted-foreground)')}
              strokeOpacity={0.3}
              strokeWidth={2}
              dot={<MoodDot />}
              activeDot={<MoodActiveDot />}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="ma"
              stroke={resolveCSSVar('var(--destructive)')}
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <MoodLegend />
    </CardContent>
  </Card>
));

const DistributionSection = memo(({ chartData, onExportPNG, onExportCSV, containerRef, tickFillColor, borderColor }: {
  chartData: DistributionDataPoint[];
  onExportPNG: () => void;
  onExportCSV: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tickFillColor: string;
  borderColor: string;
}) => (
  <Card ref={containerRef} id="mood-distribution">
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
      <CardTitle className="text-base font-semibold">Mood Distribution</CardTitle>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onExportPNG} aria-label="Export distribution chart as PNG">
          <Share size={16} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onExportCSV} aria-label="Export distribution data as CSV">
          <Download size={16} aria-hidden="true" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.5} />
            <XAxis
              dataKey="mood"
              tick={{ fontSize: 14, fill: tickFillColor }}
              axisLine={{ stroke: borderColor }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tickFillColor }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, _name: string, props: { payload?: { label?: string } }) => [`${value} entries`, props.payload?.label ?? '']}
              cursor={{ fill: resolveCSSVar('var(--muted)'), opacity: 0.2 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <MoodLegend />
    </CardContent>
  </Card>
));

const MoodCalendarSection = memo(({ days, onDayClick, onEntryClick }: {
  days: CalendarDay[];
  onDayClick?: (date: string) => void;
  onEntryClick?: (entry: Entry) => void;
}) => {
  const [moodFilter, setMoodFilter] = useState('all');

  const handleDayClick = (day: FilteredCalendarDay) => {
    if (day.isFuture) return;
    if (day.entry && onEntryClick) {
      onEntryClick(day.entry);
    } else if (!day.entry && onDayClick) {
      onDayClick(day.dateString);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, day: FilteredCalendarDay) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(day);
    }
  };

  const filteredDays = useMemo((): FilteredCalendarDay[] => days.map(day => {
    if (moodFilter === 'all') return day;
    if (!day.entry) return day;
    const moodMatch = day.entry.mood === parseInt(moodFilter);
    return { ...day, dimmed: !moodMatch };
  }), [days, moodFilter]);

  const moodOptions = [
    { value: 'all', label: 'All Moods' },
    { value: '5', label: '😊 Rad' },
    { value: '4', label: '🙂 Good' },
    { value: '3', label: '😐 Meh' },
    { value: '2', label: '😔 Bad' },
    { value: '1', label: '😢 Awful' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Mood Calendar</CardTitle>
          <div className="text-xs text-muted-foreground">Click a day to add or view an entry</div>
        </div>

        <Select value={moodFilter} onValueChange={setMoodFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter by mood" />
          </SelectTrigger>
          <SelectContent>
            {moodOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {filteredDays.map((day) => {
            const { key, label, entry, IconComponent, iconColor, isCurrentMonth, isToday, isFuture, dimmed } = day;
            const isClickable = !isFuture && (onDayClick || onEntryClick);

            return (
              <div
                key={key}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={() => handleDayClick(day)}
                onKeyDown={(e) => handleKeyDown(e, day)}
                className={cn(
                  "aspect-square rounded-md flex flex-col items-center justify-center text-xs relative transition-[colors,opacity] border",
                  entry ? "border-transparent" : "border-transparent hover:border-primary/20",
                  !isCurrentMonth && "opacity-30",
                  isFuture && "opacity-20 cursor-not-allowed",
                  isToday && !entry && "ring-2 ring-primary ring-offset-1",
                  isClickable && !entry && "cursor-pointer bg-muted/30 hover:bg-muted",
                  isClickable && entry && "cursor-pointer hover:brightness-110 shadow-sm",
                  dimmed && "opacity-20"
                )}
                style={{
                  backgroundColor: entry && iconColor ? iconColor : undefined,
                  color: entry ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
                title={entry ? `View entry for ${day.dateString}` : isFuture ? `${day.dateString} (future)` : `Add entry for ${day.dateString}`}
              >
                {entry && IconComponent ? (
                  <IconComponent size={16} strokeWidth={2.5} />
                ) : !isFuture && !entry ? (
                  <div className="flex flex-col items-center text-muted-foreground/50 group-hover:text-primary">
                    <span className="font-medium">{label}</span>
                  </div>
                ) : (
                  label
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

// ========== Main Component ==========

const LoadingState = memo(() => (
  <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading statistics">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={120} className="w-full" radius={12} />
      ))}
    </div>
    <div className="space-y-2">
      <Skeleton height={300} className="w-full" radius={16} />
    </div>
    <span className="sr-only">Loading statistics...</span>
  </div>
));

const ErrorState = memo(({ message }: { message: string }) => (
  <div className="flex items-center justify-center p-12 text-destructive bg-destructive/10 rounded-xl">
    {message}
  </div>
));

const EmptyState = memo(() => (
  <div className="flex items-center justify-center p-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
    No statistics available yet. Start tracking your mood to see insights!
  </div>
));

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
