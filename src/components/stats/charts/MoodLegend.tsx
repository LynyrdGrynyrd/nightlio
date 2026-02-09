import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MOOD_LEGEND, resolveCSSVar } from '../statisticsConstants';

interface MoodLegendItem {
  value: number;
  icon: LucideIcon;
  color: string;
  label: string;
}

const MoodLegend = memo(function MoodLegend({ resolvedColors }: { resolvedColors?: Record<number, string> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
      {MOOD_LEGEND.map(({ value, icon: Icon, color, label }: MoodLegendItem) => (
        <div key={value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon size={14} style={{ color: resolvedColors?.[value] || resolveCSSVar(color) }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
});

export default MoodLegend;
