import React, { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Share, Download } from 'lucide-react';
import { TOOLTIP_STYLE, MOOD_SHORTHANDS, resolveCSSVar } from '../statisticsConstants';
import { formatTrendTooltip } from '../statisticsUtils';
import { MoodDot, MoodActiveDot } from './MoodDots';
import MoodLegend from './MoodLegend';
import RangeSelector from './RangeSelector';

const CHART_MARGIN = { top: 20, right: 10, left: -20, bottom: 0 };

interface ChartDataPoint {
  date: string;
  mood: number | null;
  ma?: number | null;
  dateLabel?: string;
  [key: string]: unknown;
}

const MoodTrendSection = memo(function MoodTrendSection({ chartData, range, onChangeRange, onExportPNG, onExportCSV, containerRef, tickFillColor, borderColor }: {
  chartData: ChartDataPoint[];
  range: number;
  onChangeRange: (range: number) => void;
  onExportPNG: () => void;
  onExportCSV: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tickFillColor: string;
  borderColor: string;
}) {
  return (
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
  );
});

export default MoodTrendSection;
