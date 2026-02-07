import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Image, Calendar, X } from 'lucide-react';
import apiService, { GalleryPhoto, GalleryResponse } from '../services/api';
import PhotoGrid from '../components/gallery/PhotoGrid';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';

// ========== Types ==========

interface DateRange {
  start: string;
  end: string;
}

interface GalleryViewProps {
  onEntryClick: (entry: { id: number }) => void;
}

// ========== Component ==========

const GalleryView = ({ onEntryClick }: GalleryViewProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const LIMIT = 24;

  const fetchPhotos = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const result: GalleryResponse = await apiService.getGalleryPhotos({
        limit: LIMIT,
        offset: currentOffset,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      });

      if (reset) {
        setPhotos(result.photos);
        setOffset(LIMIT);
      } else {
        setPhotos(prev => [...prev, ...result.photos]);
        setOffset(prev => prev + LIMIT);
      }
      setHasMore(result.has_more);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [offset, dateRange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPhotos(true);
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end]);

  const handlePhotoClick = (photo: GalleryPhoto) => {
    if (onEntryClick) {
      onEntryClick({ id: photo.entry_id });
    }
  };

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, start: e.target.value }));
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, end: e.target.value }));
  };

  const handleClearDates = () => {
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-4rem)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Image size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Photo Gallery
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{total}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Reflect on your memories through photos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border shadow-sm">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              name="gallery-start-date"
              autoComplete="off"
              value={dateRange.start}
              onChange={handleStartDateChange}
              className="h-9 w-36 pl-9 pr-2 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border-0"
              placeholder="Start Date"
            />
          </div>
          <span className="text-muted-foreground text-xs font-medium px-1">to</span>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              name="gallery-end-date"
              autoComplete="off"
              value={dateRange.end}
              onChange={handleEndDateChange}
              className="h-9 w-36 pl-9 pr-2 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border-0"
              placeholder="End Date"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearDates}
              className="h-8 w-8 ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear Filters"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </header>

      {photos.length === 0 && !loading ? (
        <EmptyState
          variant="noPhotos"
          message={dateRange.start || dateRange.end ? "No photos found in this date range. Try adjusting your filters." : undefined}
          actionLabel={(dateRange.start || dateRange.end) ? "Clear Filters" : undefined}
          onAction={(dateRange.start || dateRange.end) ? handleClearDates : undefined}
        />
      ) : (
        <>
          <PhotoGrid
            photos={photos}
            onPhotoClick={handlePhotoClick}
            loading={loading && photos.length === 0}
          />

          {hasMore && (
            <div className="flex justify-center pt-8 pb-12">
              <Button
                onClick={() => fetchPhotos(false)}
                disabled={loading}
                variant="outline"
                size="lg"
                className="min-w-[150px] rounded-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GalleryView;
