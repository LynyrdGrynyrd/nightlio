import { memo } from 'react';
import Skeleton from '../../ui/Skeleton';
import WellnessIllustration from '../../ui/WellnessIllustration';

export const LoadingState = memo(function LoadingState() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading statistics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={120} className="w-full" radius={12} />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton height={300} className="w-full" radius={16} />
      </div>
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
});

export const ErrorState = memo(function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-destructive bg-destructive/10 rounded-[calc(var(--radius)+4px)]">
      <WellnessIllustration variant="insights" />
      <p className="max-w-md text-center">{message}</p>
    </div>
  );
});

export const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-muted-foreground bg-muted/10 rounded-[calc(var(--radius)+4px)] border border-dashed">
      <WellnessIllustration variant="insights" />
      <p className="max-w-lg text-center">You are just getting started. A few more entries will reveal your mood patterns.</p>
    </div>
  );
});
