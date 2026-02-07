import { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GridGapToken = 'compact' | 'normal' | 'relaxed';

export interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  minCardWidth?: string;
  maxColumns?: number;
  gapToken?: GridGapToken;
}

const gapClassByToken: Record<GridGapToken, string> = {
  compact: 'gap-3',
  normal: 'gap-4 md:gap-5',
  relaxed: 'gap-6',
};

const gapValueByToken: Record<GridGapToken, string> = {
  compact: '0.75rem',
  normal: '1rem',
  relaxed: '1.5rem',
};

const ResponsiveGrid = ({
  children,
  className,
  minCardWidth = '17rem',
  maxColumns,
  gapToken = 'normal',
  style: styleOverride,
  ...rest
}: ResponsiveGridProps) => {
  const style = {
    '--rg-min': minCardWidth,
    '--rg-gap': gapValueByToken[gapToken],
    ...(maxColumns
      ? {
          maxWidth: `calc(${maxColumns} * var(--rg-min) + ${Math.max(maxColumns - 1, 0)} * var(--rg-gap))`,
          marginInline: 'auto',
        }
      : {}),
    ...(styleOverride as CSSProperties),
  } as CSSProperties;

  return (
    <div
      className={cn(
        'grid w-full [grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--rg-min)),1fr))]',
        gapClassByToken[gapToken],
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;
