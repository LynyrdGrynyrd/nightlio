import React, { useCallback, useRef, useState, memo, ChangeEvent, KeyboardEvent, CSSProperties } from 'react';
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
  Cell,
} from 'recharts';
import { LucideIcon } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import { exportSVGToPNG, exportDataToCSV } from '../../utils/exportUtils';
import useStatisticsViewData from './useStatisticsViewData';
import ScaleTrendChart from './ScaleTrendChart';

import YearInPixels from './YearInPixels';
import ActivityCorrelations from './ActivityCorrelations';
import FrequentlyTogether from './FrequentlyTogether';
import AdvancedCorrelations from './AdvancedCorrelations';
import StreakChain from './StreakChain';
import MoodStability from './MoodStability';
import { ImportantDaysList } from '../ImportantDays';
import {
  RANGE_OPTIONS,
  TOOLTIP_STYLE,
  MOOD_LEGEND,
  MOOD_SHORTHANDS,
  WEEK_DAYS,
  formatTrendTooltip,
} from './statisticsViewUtils';
import './StatisticsView.css';

interface OverviewCard {
  key: string;
  value: string | number;
  label: string;
  tone?: 'danger';
}

interface MoodLegendItem {
  value: number;
  icon: LucideIcon;
  color: string;
  label: string;
}

interface ChartDataPoint {
  date: string;
  mood: number;
  ma?: number;
  dateLabel?: string;
}

interface DistributionDataPoint {
  key: string;
  mood: string;
  label: string;
  count: number;
  fill: string;
}

interface CalendarDay {
  key: string;
  label: string;
  entry: any;
  IconComponent: LucideIcon | null;
  iconColor: string | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  dimmed?: boolean;
  dateString: string;
}

interface StatisticsViewProps {
  statistics: any;
  pastEntries: any[];
  loading: boolean;
  error?: string;
  onDayClick?: (date: string) => void;
  onEntryClick?: (entry: any) => void;
}

// ⚡ Perf: Memoized - static component that never needs to re-render
const MoodLegend = memo(() => (
  <div className="statistics-view__legend">
    {MOOD_LEGEND.map(({ value, icon, color, label }: MoodLegendItem) => {
      const LegendIcon = icon;
      return (
        <div key={value} className="statistics-view__legend-item">
          <LegendIcon size={16} style={{ color }} />
          <span>{label}</span>
        </div>
      );
    })}
  </div>
));

// ⚡ Perf: Memoized - only re-renders when cards data changes
const StatisticsOverviewGrid = memo(({ cards }: { cards: OverviewCard[] }) => (
  <div className="statistics-view__overview-grid">
    {cards.map(({ key, value, label, tone }) => {
      const valueClassName = tone === 'danger'
        ? 'statistics-view__overview-value statistics-view__overview-value--danger'
        : 'statistics-view__overview-value';

      return (
        <div key={key} className="statistics-view__card statistics-view__overview-card">
          <div className={valueClassName}>{value}</div>
          <div className="statistics-view__overview-label">{label}</div>
        </div>
      );
    })}
  </div>
));

// ⚡ Perf: Memoized - only re-renders when title or children change
const SectionHeader = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="statistics-view__section-header">
    <h3 className="statistics-view__section-title">{title}</h3>
    <div className="statistics-view__button-row">{children}</div>
  </div>
));

// ⚡ Perf: Memoized - only re-renders when range value changes
const RangeSelector = memo(({ range, onChange }: { range: number; onChange: (range: number) => void }) => (
  <div className="statistics-view__range-buttons">
    {RANGE_OPTIONS.map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => onChange(option)}
        className={`statistics-view__range-button\${range === option ? ' is-active' : ''}`}
      >
        {option}d
      </button>
    ))}
  </div>
));

const MoodTrendSection = ({ chartData, range, onChangeRange, onExportPNG, onExportCSV, containerRef }: {
  chartData: ChartDataPoint[];
  range: number;
  onChangeRange: (range: number) => void;
  onExportPNG: () => void;
  onExportCSV: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) => (
  <div ref={containerRef} className="statistics-view__card statistics-view__section" id="mood-trend">
    <SectionHeader title="Mood Trend">
      <RangeSelector range={range} onChange={onChangeRange} />
      <button type="button" className="statistics-view__ghost-button" onClick={onExportPNG}>
        Export PNG
      </button>
      <button type="button" className="statistics-view__ghost-button" onClick={onExportCSV}>
        Export CSV
      </button>
    </SectionHeader>

    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
        <YAxis
          domain={[0.5, 5.5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border)' }}
          width={20}
          tickFormatter={(value) => MOOD_SHORTHANDS[value as number] || ''}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={formatTrendTooltip} />
        <Line
          type="monotone"
          dataKey="mood"
          stroke="var(--accent-600)"
          strokeWidth={3}
          dot={{ fill: 'var(--accent-600)', strokeWidth: 2, r: 6 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="ma"
          stroke="var(--danger)"
          strokeDasharray="6 6"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>

    <MoodLegend />
  </div>
);

const DistributionSection = ({ chartData, onExportPNG, onExportCSV, containerRef }: {
  chartData: DistributionDataPoint[];
  onExportPNG: () => void;
  onExportCSV: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) => (
  <div ref={containerRef} className="statistics-view__card statistics-view__section" id="mood-distribution">
    <SectionHeader title="Mood Distribution">
      <button type="button" className="statistics-view__ghost-button" onClick={onExportPNG}>
        Export PNG
      </button>
      <button type="button" className="statistics-view__ghost-button" onClick={onExportCSV}>
        Export CSV
      </button>
    </SectionHeader>

    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="mood" tick={{ fontSize: 16, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border)' }}
          allowDecimals={false}
          domain={[0, 'dataMax + 1']}
          width={20}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, _name, props: any) => [`\${value} entries`, props.payload.label]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fontWeight: 600, fill: 'var(--text)' }}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>

    <MoodLegend />
  </div>
);

const MoodCalendarSection = ({ days, onDayClick, onEntryClick }: {
  days: CalendarDay[];
  onDayClick?: (date: string) => void;
  onEntryClick?: (entry: any) => void;
}) => {
  const [moodFilter, setMoodFilter] = useState('all');

  const handleDayClick = (day: CalendarDay) => {
    if (day.isFuture) return; // Prevent future date clicks
    if (day.entry && onEntryClick) {
      onEntryClick(day.entry);
    } else if (!day.entry && onDayClick) {
      onDayClick(day.dateString);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, day: CalendarDay) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(day);
    }
  };

  const handleMoodFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setMoodFilter(e.target.value);
  };

  // Filter days based on mood selection
  const filteredDays = days.map(day => {
    if (moodFilter === 'all') return day;
    if (!day.entry) return day;
    const moodMatch = day.entry.mood === parseInt(moodFilter);
    return { ...day, dimmed: !moodMatch };
  });

  const moodOptions = [
    { value: 'all', label: 'All Moods' },
    { value: '5', label: '😊 Rad' },
    { value: '4', label: '🙂 Good' },
    { value: '3', label: '😐 Meh' },
    { value: '2', label: '😔 Bad' },
    { value: '1', label: '😢 Awful' },
  ];

  const headerContainerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  };

  const titleStyle: CSSProperties = {
    margin: 0
  };

  const selectStyle: CSSProperties = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '0.85rem',
    cursor: 'pointer'
  };

  return (
    <div className="statistics-view__card statistics-view__calendar-card">
      <div style={headerContainerStyle}>
        <h3 className="statistics-view__calendar-title" style={titleStyle}>Mood Calendar</h3>
        <select
          value={moodFilter}
          onChange={handleMoodFilterChange}
          style={selectStyle}
          aria-label="Filter by mood"
        >
          {moodOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <p className="statistics-view__calendar-hint">Click a day to add or view an entry</p>
      <div className="statistics-view__calendar-grid">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="statistics-view__calendar-label">
            {day}
          </div>
        ))}

        {filteredDays.map((day) => {
          const { key, label, entry, IconComponent, iconColor, isCurrentMonth, isToday, isFuture, dimmed } = day;
          const isClickable = !isFuture && (onDayClick || onEntryClick);

          const dayStyle: CSSProperties = {
            background: entry && iconColor ? `color-mix(in oklab, \${iconColor} 18%, transparent)` : undefined,
            color: entry && iconColor ? iconColor : undefined,
            opacity: dimmed ? 0.3 : 1,
            transition: 'opacity 0.2s'
          };

          return (
            <div
              key={key}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => handleKeyDown(e, day)}
              className={`statistics-view__calendar-day\${entry ? ' has-entry' : ''}\${isCurrentMonth ? '' : ' is-outside'}\${isToday ? ' is-today' : ''}\${isFuture ? ' is-future' : ''}\${isClickable ? ' is-clickable' : ''}`}
              style={dayStyle}
              aria-label={entry ? `View entry for \${day.dateString}` : isFuture ? `\${day.dateString} (future)` : `Add entry for \${day.dateString}`}
            >
              {entry && IconComponent ? (
                <IconComponent size={16} />
              ) : !isFuture && !entry ? (
                <div className="statistics-view__calendar-add">
                  <div className="plus-icon">+</div>
                  <span className="day-label">{label}</span>
                </div>
              ) : (
                label
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ⚡ Perf: Memoized - static loading skeleton that never needs to re-render
const LoadingState = memo(() => (
  <div className="statistics-view">
    <div className="statistics-view__overview-grid">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={120} radius={12} />
      ))}
    </div>
    <Skeleton height={36} width={260} style={{ marginBottom: 12 }} />
    <Skeleton height={320} radius={16} />
  </div>
));

// ⚡ Perf: Memoized - only re-renders when error message changes
const ErrorState = memo(({ message }: { message: string }) => (
  <div className="statistics-view statistics-view__status statistics-view__status--error">{message}</div>
));

const EmptyState = () => (
  <div className="statistics-view statistics-view__status">No statistics available</div>
);

const StatisticsView = ({ statistics, pastEntries, loading, error, onDayClick, onEntryClick }: StatisticsViewProps) => {
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const trendRef = useRef<HTMLDivElement>(null);
  const distributionRef = useRef<HTMLDivElement>(null);

  const {
    hasStatistics,
    weeklyMoodData,
    trendChartData,
    moodDistributionData,
    tagStats,
    frequentPairs,
    calendarDays,
    overviewCards,
  } = useStatisticsViewData(statistics, pastEntries, range);

  const handleExportTrendPNG = useCallback(() => {
    const svg = trendRef.current?.querySelector('svg');
    if (svg) {
      exportSVGToPNG(svg, `mood-trend-\${range}d.png`);
    }
  }, [range]);

  const handleExportTrendCSV = useCallback(() => {
    exportDataToCSV(weeklyMoodData, ['date', 'mood'], `mood-trend-\${range}d.csv`);
  }, [weeklyMoodData, range]);

  const handleExportDistributionPNG = useCallback(() => {
    const svg = distributionRef.current?.querySelector('svg');
    if (svg) {
      exportSVGToPNG(svg, 'mood-distribution.png');
    }
  }, []);

  const handleExportDistributionCSV = useCallback(() => {
    const rows = moodDistributionData.map(({ label, count }) => ({ mood: label, count }));
    exportDataToCSV(rows, ['mood', 'count'], 'mood-distribution.csv');
  }, [moodDistributionData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!hasStatistics) return <EmptyState />;

  return (
    <div className="statistics-view">
      <StreakChain />
      <MoodStability />
      <ImportantDaysList />
      <StatisticsOverviewGrid cards={overviewCards} />
      <MoodTrendSection
        chartData={trendChartData}
        range={range}
        onChangeRange={setRange}
        onExportPNG={handleExportTrendPNG}
        onExportCSV={handleExportTrendCSV}
        containerRef={trendRef}
      />

      {/* Scale Trend Section */}
      <div className="statistics-view__card statistics-view__section">
        <h3 className="statistics-view__section-title">Scale Trends</h3>
        <ScaleTrendChart data={trendChartData} scales={tagStats?.scales || []} />
      </div>

      <DistributionSection
        chartData={moodDistributionData}
        onExportPNG={handleExportDistributionPNG}
        onExportCSV={handleExportDistributionCSV}
        containerRef={distributionRef}
      />
      <ActivityCorrelations data={tagStats} />
      <FrequentlyTogether data={frequentPairs} />
      <YearInPixels entries={pastEntries} onDayClick={onDayClick} />
      <MoodCalendarSection days={calendarDays} onDayClick={onDayClick} onEntryClick={onEntryClick} />
    </div>
  );
};

export default StatisticsView;
