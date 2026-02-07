/**
 * ProgressBar - Backwards-compatible wrapper around shadcn Progress
 * 
 * This component maintains the existing ProgressBar API (value, max, label)
 * while internally using shadcn/ui Progress primitives.
 * 
 * For new code, prefer using Progress directly:
 * import { Progress } from '@/components/ui/progress';
 */
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
  className?: string;
}

const ProgressBar = ({ value = 0, max = 100, label, className }: ProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between mb-1.5 text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <Progress value={pct} className="h-2" />
    </div>
  );
};

export default ProgressBar;
