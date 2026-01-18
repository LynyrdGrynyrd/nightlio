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
import { TOOLTIP_STYLE } from './statisticsViewUtils';

// ========== Types ==========

interface Scale {
  id: number;
  name: string;
  color_hex?: string;
}

interface TrendDataPoint {
  dateLabel: string;
  [key: string]: string | number | null | undefined;
}

interface ScaleTrendChartProps {
  data: TrendDataPoint[];
  scales: Scale[];
}

// ========== Component ==========

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
            stroke={scale.color_hex || '#8884d8'}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ScaleTrendChart;
