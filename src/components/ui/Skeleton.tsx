/**
 * Skeleton - Backwards-compatible wrapper around shadcn Skeleton
 * 
 * This component maintains the existing Skeleton API (height, width, radius)
 * while internally using shadcn/ui Skeleton primitives.
 * 
 * For new code, prefer using Skeleton directly with Tailwind classes:
 * import { Skeleton } from '@/components/ui/skeleton';
 * <Skeleton className="h-4 w-full" />
 */
import { cn } from '@/lib/utils';

interface SkeletonProps {
    height?: number | string;
    width?: number | string;
    radius?: number;
    className?: string;
}

// Base shadcn Skeleton - named export for compatibility
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    );
}

// Legacy Skeleton wrapper - default export for backwards compatibility
const LegacySkeleton = ({
    height = 16,
    width = '100%',
    radius = 8,
    className
}: SkeletonProps) => (
    <Skeleton
        className={cn(className)}
        style={{
            height,
            width,
            borderRadius: radius,
        }}
    />
);

export default LegacySkeleton;
