import { memo } from 'react';
import { Card, CardContent } from '../../ui/card';
import { cn } from '@/lib/utils';

interface OverviewCard {
  key: string;
  value: string | number;
  label: string;
  tone?: 'danger' | string;
}

const StatisticsOverviewGrid = memo(function StatisticsOverviewGrid({ cards, className }: { cards: OverviewCard[]; className?: string }) {
  return (
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
  );
});

export default StatisticsOverviewGrid;
