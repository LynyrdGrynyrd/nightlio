import { memo } from 'react';
import { RANGE_OPTIONS } from '../statisticsConstants';
import { cn } from '@/lib/utils';

const RangeSelector = memo(function RangeSelector({ range, onChange }: { range: number; onChange: (range: number) => void }) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg" role="group" aria-label="Select date range">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={range === option}
          aria-label={`Show last ${option} days`}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            range === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option}d
        </button>
      ))}
    </div>
  );
});

export default RangeSelector;
