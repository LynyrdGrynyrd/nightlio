import { useState, useEffect, useRef, useMemo, useCallback, ChangeEvent } from 'react';
import { Search, Filter, Calendar, Image, List, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HistoryList from '../components/history/HistoryList';
import PhotoGrid from '../components/gallery/PhotoGrid';
import EmptyState from '../components/ui/EmptyState';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { cn } from '@/lib/utils';
import { MOOD_CONFIG, TIMEOUTS } from '../constants/appConstants';
import apiService, { GalleryPhoto, GalleryResponse } from '../services/api';
import type { HistoryEntry } from '../types/entry';

interface SearchEntry {
  id: number;
  date: string;
  mood: number;
  content: string;
}

interface JournalViewProps {
  pastEntries: HistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  onDelete: (id: number) => void;
  onEdit: (entry: HistoryEntry) => void;
  onEntryClick: (entry: { id: number }) => void;
}

type ViewMode = 'entries' | 'photos';

const GALLERY_LIMIT = 24;

const JournalView = ({
  pastEntries,
  historyLoading,
  historyError,
  onDelete,
  onEdit,
  onEntryClick,
}: JournalViewProps) => {
  const navigate = useNavigate();

  // View toggle
  const [viewMode, setViewMode] = useState<ViewMode>('entries');

  // Search & filter state
  const [query, setQuery] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchResults, setSearchResults] = useState<SearchEntry[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Gallery state (for photos mode)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [photoOffset, setPhotoOffset] = useState(0);

  const tokenRef = useRef(localStorage.getItem('twilightio_token'));
  const selectedMoodsSet = useMemo(() => new Set(selectedMoods), [selectedMoods]);
  const hasActiveFilters = query || selectedMoods.length > 0 || startDate || endDate;

  // Search entries (debounced)
  useEffect(() => {
    if (!hasActiveFilters) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (selectedMoods.length > 0) params.append('moods', selectedMoods.join(','));
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const res = await fetch(`/api/search?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${tokenRef.current}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Journal search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, TIMEOUTS.DEBOUNCE_SEARCH);

    return () => clearTimeout(timer);
  }, [query, selectedMoods, startDate, endDate, hasActiveFilters]);

  // Fetch photos (for photos mode)
  const fetchPhotos = useCallback(async (reset = false) => {
    setPhotosLoading(true);
    try {
      const currentOffset = reset ? 0 : photoOffset;
      const result: GalleryResponse = await apiService.getGalleryPhotos({
        limit: GALLERY_LIMIT,
        offset: currentOffset,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (reset) {
        setPhotos(result.photos);
        setPhotoOffset(GALLERY_LIMIT);
      } else {
        setPhotos(prev => [...prev, ...result.photos]);
        setPhotoOffset(prev => prev + GALLERY_LIMIT);
      }
      setHasMorePhotos(result.has_more);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setPhotosLoading(false);
    }
  }, [photoOffset, startDate, endDate]);

  // Reload photos when switching to photos mode or when date filters change
  useEffect(() => {
    if (viewMode === 'photos') {
      const timer = setTimeout(() => fetchPhotos(true), 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMood = (mood: number) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedMoods([]);
    setStartDate('');
    setEndDate('');
  };

  // Convert search results to HistoryEntry-compatible format for HistoryList
  const filteredEntries = useMemo(() => {
    if (!searchResults) return pastEntries;

    const searchIds = new Set(searchResults.map(r => r.id));
    return pastEntries.filter(entry => searchIds.has(entry.id));
  }, [searchResults, pastEntries]);

  const handlePhotoClick = (photo: GalleryPhoto) => {
    onEntryClick({ id: photo.entry_id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Journal Library</h1>
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-0.5">
            <Button
              variant={viewMode === 'entries' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setViewMode('entries')}
            >
              <List size={14} />
              Reflections
            </Button>
            <Button
              variant={viewMode === 'photos' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setViewMode('photos')}
            >
              <Image size={14} />
              Photos
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search reflections, moments, and themes..."
            name="journal-search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Mood badges */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter size={12} />
              Mood tone
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_CONFIG.map(m => {
                const isSelected = selectedMoodsSet.has(m.value);
                return (
                  <Badge
                    key={m.value}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all hover:opacity-80 text-xs',
                      isSelected ? '' : 'opacity-50 hover:opacity-100'
                    )}
                    style={isSelected ? { backgroundColor: m.color } : undefined}
                    onClick={() => toggleMood(m.value)}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`Filter by ${m.label}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleMood(m.value);
                      }
                    }}
                  >
                    {m.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar size={12} />
              Date window
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="h-8 text-xs w-auto"
                aria-label="Start date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="h-8 text-xs w-auto"
                aria-label="End date"
              />
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Clear all filters"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'entries' ? (
        <HistoryList
          entries={filteredEntries}
          loading={historyLoading}
          error={historyError ?? undefined}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
        <div className="space-y-6">
          {photos.length === 0 && !photosLoading ? (
            <EmptyState
              variant="noPhotos"
              message={hasActiveFilters ? 'No photo moments match these filters yet.' : undefined}
              actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <PhotoGrid
                photos={photos}
                onPhotoClick={handlePhotoClick}
                loading={photosLoading && photos.length === 0}
              />
              {hasMorePhotos && (
                <div className="flex justify-center pt-4 pb-8">
                  <Button
                    onClick={() => fetchPhotos(false)}
                    disabled={photosLoading}
                    variant="outline"
                    size="lg"
                    className="min-w-[150px] rounded-full"
                  >
                    {photosLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Moments'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalView;
