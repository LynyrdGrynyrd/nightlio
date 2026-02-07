import { memo } from 'react';
import { getIconComponent } from '../ui/IconPicker';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface Activity {
  id: number;
  name: string;
  icon: string;
  count: number;
  average_mood: string;
  impact_score: number;
}

interface ActivityCorrelationsData {
  activities: Activity[];
  overall_average: number;
}

interface ActivityCorrelationsProps {
  data: ActivityCorrelationsData | null;
}

const ActivityCorrelations = ({ data }: ActivityCorrelationsProps) => {
  if (!data || !data.activities || data.activities.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground border-dashed bg-muted/10">
        Not enough data to calculate impact yet.
      </Card>
    );
  }

  const { activities, overall_average } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Influence on Mood</CardTitle>
        <CardDescription>
          How activities affect your average ({(overall_average ?? 0).toFixed(2)})
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {activities.map((activity) => {
            const Icon = getIconComponent(activity.icon);
            const impact = activity.impact_score;
            const isPositive = impact > 0;
            const isNeutral = impact === 0;

            return (
              <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-accent/20 flex items-center justify-center text-foreground shrink-0">
                    {Icon && <Icon size={18} />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{activity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.count} entries • Avg: {activity.average_mood}
                    </div>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "font-bold text-xs px-2 min-w-[3rem] justify-center",
                    isPositive && "border-[color:var(--success)] bg-[color:var(--success-soft)] text-[color:var(--success)]",
                    !isPositive && !isNeutral && "border-[color:var(--destructive)] bg-[color:var(--destructive-soft)] text-[color:var(--destructive)]",
                    isNeutral && "bg-muted text-muted-foreground"
                  )}
                >
                  {isPositive && '+'}{impact}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ActivityCorrelations);
