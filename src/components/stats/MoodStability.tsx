import { useState, useEffect, useMemo, memo } from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import apiService from '../../services/api';
import { CHART_CONFIG } from '../../constants/appConstants';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '@/lib/utils';

interface TrendPoint {
  date: string;
  score: number | null;
}

interface StabilityScore {
  score: number;
  count: number;
}


const getInterpretation = (score: number) => {
  const C = CHART_CONFIG.STABILITY;

  if (score >= C.THRESHOLDS.VERY_STABLE) return { label: C.LABELS.VERY_STABLE, color: C.COLORS.VERY_STABLE, twColorClass: "bg-[color-mix(in_oklab,var(--mood-4)_15%,transparent)] text-[var(--mood-4)]" };
  if (score >= C.THRESHOLDS.STABLE) return { label: C.LABELS.STABLE, color: C.COLORS.STABLE, twColorClass: "bg-[color-mix(in_oklab,var(--mood-5)_15%,transparent)] text-[var(--mood-5)]" };
  if (score >= C.THRESHOLDS.VARIABLE) return { label: C.LABELS.VARIABLE, color: C.COLORS.VARIABLE, twColorClass: "bg-[color-mix(in_oklab,var(--mood-3)_15%,transparent)] text-[var(--mood-3)]" };
  return { label: C.LABELS.VOLATILE, color: C.COLORS.VOLATILE, twColorClass: "bg-[color-mix(in_oklab,var(--mood-1)_15%,transparent)] text-[var(--mood-1)]" };
};

const MoodStability = () => {
  const [data, setData] = useState<StabilityScore | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const result = await apiService.getMoodStability(30);
        if (mounted) {
          if (result.score) {
            setData(result.score);
          }
          if (result.trend_data) {
            setTrend(result.trend_data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch mood stability:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  // Prepare trend data ensuring valid numbers - must be called before early returns
  const chartData = useMemo(() =>
    trend
      .map(d => ({
        date: d.date,
        score: d.score !== null ? d.score : 0
      }))
      .filter(d => d.score > 0),
    [trend]
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { score, count } = data;
  const { label, color, twColorClass } = getInterpretation(score);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          Mood Stability
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="text-3xl font-bold tabular-nums" style={{ color }}>
              {score}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide", twColorClass)} style={!twColorClass ? { backgroundColor: `${color}20`, color } : undefined}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                Last 30 days • {count} entries
              </span>
            </div>
          </div>

          <div className="h-[60px] w-[140px] sm:w-[200px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                No trend data
              </div>
            )}
          </div>
        </div>

        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(MoodStability);
