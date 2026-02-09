import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TOOLTIP_STYLE } from './statisticsConstants';

interface Scale {
  id: number;
  name: string;
  color_hex?: string;
}

interface DataPoint {
  dateLabel: string;
  [key: string]: string | number;
}

interface ScaleTrendChartProps {
  data: DataPoint[];
  scales: Scale[];
}

const ScaleTrendChart = ({ data, scales }: ScaleTrendChartProps) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border)' }}
          width={30}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend />

        {scales.map((scale) => (
          <Line
            key={scale.id}
            type="monotone"
            dataKey={scale.name}
            stroke={scale.color_hex || 'var(--primary)'}
            strokeWidth={3}
            dot={{ r: 5, fill: scale.color_hex || 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
            activeDot={{ r: 7, fill: scale.color_hex || 'var(--primary)' }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default memo(ScaleTrendChart);
