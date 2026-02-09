import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Share, Download } from 'lucide-react';
import { TOOLTIP_STYLE, resolveCSSVar } from '../statisticsConstants';
import MoodLegend from './MoodLegend';

interface DistributionDataPoint {
  key: string | number;
  mood: string;
  label: string;
  count: number;
  fill: string;
}

const DistributionSection = memo(function DistributionSection({ chartData, onExportPNG, onExportCSV, containerRef, tickFillColor, borderColor }: {
  chartData: DistributionDataPoint[];
  onExportPNG: () => void;
  onExportCSV: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  tickFillColor: string;
  borderColor: string;
}) {
  return (
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
  );
});

export default DistributionSection;
