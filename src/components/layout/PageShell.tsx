import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageShellVariant = 'default' | 'analytics' | 'editor';
export type PageShellMaxWidthToken = 'content' | 'wide' | 'editor';
export type PageShellGutterToken = 'compact' | 'normal' | 'relaxed';

export interface PageShellProps {
  children: ReactNode;
  className?: string;
  variant?: PageShellVariant;
  maxWidthToken?: PageShellMaxWidthToken;
  gutterToken?: PageShellGutterToken;
}

const maxWidthClasses: Record<PageShellMaxWidthToken, string> = {
  content: 'max-w-6xl',
  wide: 'max-w-[92rem]',
  editor: 'max-w-7xl',
};

const gutterClasses: Record<PageShellGutterToken, string> = {
  compact: 'px-4 py-4 md:px-5 md:py-5',
  normal: 'px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8',
  relaxed: 'px-4 py-5 md:px-6 md:py-7 lg:px-10 lg:py-10',
};

const variantClasses: Record<PageShellVariant, string> = {
  default: 'space-y-8',
  analytics: 'space-y-6',
  editor: 'space-y-6',
};

const PageShell = ({
  children,
  className,
  variant = 'default',
  maxWidthToken = 'content',
  gutterToken = 'normal',
}: PageShellProps) => {
  return (
    <section
      className={cn(
        'mx-auto w-full animate-in fade-in duration-300',
        maxWidthClasses[maxWidthToken],
        gutterClasses[gutterToken],
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </section>
  );
};

export default PageShell;
