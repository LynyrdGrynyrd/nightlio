import { useState, useMemo, memo } from 'react';
import HistoryEntryCard from './HistoryEntry';
import AddEntryCard from './AddEntryCard';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { Button } from '../ui/button';
import ResponsiveGrid from '../layout/ResponsiveGrid';

import type { HistoryEntry } from '@/types/entry';

// Number of items to show initially and on each "Load More"
const INITIAL_ITEMS = 20;
const ITEMS_PER_PAGE = 20;

interface HistoryListProps {
  entries: HistoryEntry[];
  loading: boolean;
  error?: string;
  onDelete: (id: number) => void;
  onEdit?: (entry: HistoryEntry) => void;
}

const HistoryList = memo(({ entries, loading, error, onDelete, onEdit }: HistoryListProps) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);

  // Memoize the visible entries slice
  const visibleEntries = useMemo(
    () => entries.slice(0, visibleCount),
    [entries, visibleCount]
  );

  const hasMore = entries.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, entries.length));
  };
  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <Skeleton height={28} width={220} className="mb-4" />
        <ResponsiveGrid minCardWidth="17rem" maxColumns={5} gapToken="normal">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <Skeleton height={220} radius={16} />
            </div>
          ))}
        </ResponsiveGrid>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-8 bg-destructive/10 rounded-xl my-4">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <ResponsiveGrid minCardWidth="17rem" maxColumns={5} gapToken="normal" className="py-4">
        <AddEntryCard />
        <div className="col-span-full">
          <EmptyState
            variant="noHistory"
            actionLabel="Create Entry"
            onAction={() => document.getElementById('fab-main-button')?.click()}
          />
        </div>
      </ResponsiveGrid>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <ResponsiveGrid minCardWidth="17rem" maxColumns={5} gapToken="normal">
        <AddEntryCard />
        {visibleEntries.map(entry => (
          <HistoryEntryCard
            key={entry.id || entry.date}
            entry={entry}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </ResponsiveGrid>
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="w-full max-w-xs"
          >
            Load More ({entries.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
});

export default HistoryList;
