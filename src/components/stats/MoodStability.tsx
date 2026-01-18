import { useState, useEffect, CSSProperties } from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import apiService from '../../services/api';
import { CHART_CONFIG } from '../../constants/appConstants';
import './MoodStability.css';

interface TrendPoint {
  date: string;
  score: number | null;
}

interface StabilityScore {
  score: number;
  count: number;
}

interface StabilityData {
  score: StabilityScore;
  trend: TrendPoint[];
}

interface Interpretation {
  label: string;
  color: string;
}

const getInterpretation = (score: number): Interpretation => {
  const C = CHART_CONFIG.STABILITY;

  if (score >= C.THRESHOLDS.VERY_STABLE) return { label: C.LABELS.VERY_STABLE, color: C.COLORS.VERY_STABLE };
  if (score >= C.THRESHOLDS.STABLE) return { label: C.LABELS.STABLE, color: C.COLORS.STABLE };
  if (score >= C.THRESHOLDS.VARIABLE) return { label: C.LABELS.VARIABLE, color: C.COLORS.VARIABLE };
  return { label: C.LABELS.VOLATILE, color: C.COLORS.VOLATILE };
};

const MoodStability = () => {
  const [data, setData] = useState<StabilityScore | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result: StabilityData = await apiService.getMoodStability(30);
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
  const chartData = trend
    .map(d => ({
      date: d.date,
      score: d.score !== null ? d.score : 0
    }))
    .filter(d => d.score > 0);

  const scoreStyle: CSSProperties = {
    '--stability-color': color
  } as CSSProperties;

  const interpretationStyle: CSSProperties = {
    color
  };

  const barStyle: CSSProperties = {
    width: `${score}%`,
    backgroundColor: color
  };

  return (
    <div className="mood-stability">
      <div className="mood-stability__header">
        <Activity size={18} />
        <h3 className="mood-stability__title">Mood Stability</h3>
      </div>

      <div className="mood-stability__content">
        <div className="mood-stability__score-container">
          <div className="mood-stability__score" style={scoreStyle}>
            {score}
          </div>
          <div className="mood-stability__details">
            <span className="mood-stability__interpretation" style={interpretationStyle}>
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
        <div className="mood-stability__bar" style={barStyle} />
      </div>
    </div>
  );
};

export default MoodStability;
