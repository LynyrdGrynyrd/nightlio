import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import apiService from '../../services/api';
import { CHART_CONFIG } from '../../constants/appConstants';
import './MoodStability.css';

// ========== Types ==========

interface StabilityInterpretation {
  label: string;
  color: string;
}

interface TrendDataPoint {
  date: string;
  score: number | null;
}

interface StabilityData {
  score: number;
  count: number;
}

interface ChartDataPoint {
  date: string;
  score: number;
}

// ========== Helper Functions ==========

const getInterpretation = (score: number): StabilityInterpretation => {
  const C = CHART_CONFIG.STABILITY;

  if (score >= C.THRESHOLDS.VERY_STABLE) return { label: C.LABELS.VERY_STABLE, color: C.COLORS.VERY_STABLE };
  if (score >= C.THRESHOLDS.STABLE) return { label: C.LABELS.STABLE, color: C.COLORS.STABLE };
  if (score >= C.THRESHOLDS.VARIABLE) return { label: C.LABELS.VARIABLE, color: C.COLORS.VARIABLE };
  return { label: C.LABELS.VOLATILE, color: C.COLORS.VOLATILE };
};

// ========== Component ==========

const MoodStability = () => {
  const [data, setData] = useState<StabilityData | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiService.getMoodStability(30);
        setData(result.score);
        setTrend(result.trend || []);
      } catch (err) {
        console.error('Failed to fetch mood stability:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mood-stability mood-stability--loading">
        <div className="mood-stability__skeleton" />
      </div>
    );
  }

  if (!data || data.score === undefined) {
    return null;
  }

  const { score, count } = data;
  const { label, color } = getInterpretation(score);

  // Prepare trend data ensuring valid numbers
  const chartData: ChartDataPoint[] = trend.map(d => ({
    date: d.date,
    score: d.score !== null ? d.score : 0
  })).filter(d => d.score > 0);

  return (
    <div className="mood-stability">
      <div className="mood-stability__header">
        <Activity size={18} />
        <h3 className="mood-stability__title">Mood Stability</h3>
      </div>

      <div className="mood-stability__content">
        <div className="mood-stability__score-container">
          <div
            className="mood-stability__score"
            style={{ '--stability-color': color } as React.CSSProperties}
          >
            {score}
          </div>
          <div className="mood-stability__details">
            <span
              className="mood-stability__interpretation"
              style={{ color }}
            >
              {label}
            </span>
            <span className="mood-stability__period">
              Last 30 days • {count} entries
            </span>
          </div>
        </div>

        <div className="mood-stability__chart">
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={[0, 100]} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={color}
                fillOpacity={1}
                fill="url(#colorScore)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mood-stability__bar-container">
        <div
          className="mood-stability__bar"
          style={{
            width: `${score}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default MoodStability;
