import { lazy, Suspense, forwardRef, ForwardedRef } from 'react';
import type { MarkdownAreaHandle } from './MarkdownArea';

// Lazy load the MDXEditor component
const MarkdownArea = lazy(() => import('./MarkdownArea'));

// Loading fallback that matches the editor's dimensions
const EditorSkeleton = () => (
  <div className="border-none rounded-2xl overflow-hidden bg-card shadow-lg">
    <div className="h-10 bg-muted/50 border-b border-border animate-pulse" />
    <div className="min-h-[300px] p-6 space-y-4">
      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
    </div>
  </div>
);

const MarkdownAreaLazy = forwardRef((props, ref: ForwardedRef<MarkdownAreaHandle>) => {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <MarkdownArea ref={ref} {...props} />
    </Suspense>
  );
});

MarkdownAreaLazy.displayName = 'MarkdownAreaLazy';

export type { MarkdownAreaHandle };
export default MarkdownAreaLazy;
