import { useState, useEffect, useCallback } from 'react';
import { Image, Calendar } from 'lucide-react';
import apiService from '../services/api';
import PhotoGrid from '../components/gallery/PhotoGrid';
import EmptyState from '../components/ui/EmptyState';
import './GalleryView.css';

const GalleryView = ({ onEntryClick }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const LIMIT = 24;

    const fetchPhotos = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;
            const result = await apiService.getGalleryPhotos({
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
        // Debounce or just run? Run immediately is fine for date usage
        const timeoutId = setTimeout(() => {
            fetchPhotos(true);
        }, 300);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange.start, dateRange.end]);
    // Note: We don't include fetchPhotos in dep array to avoid loops, 
    // relying on dateRange primitive values change to trigger.

    const handlePhotoClick = (photo) => {
        if (onEntryClick) {
            onEntryClick({ id: photo.entry_id });
        }
    };

    return (
        <div className="gallery-view">
            <header className="gallery-view__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 className="gallery-view__title">
                        <Image size={24} />
                        Photo Gallery
                    </h1>
                    <span className="gallery-view__count">{total} photos</span>
                </div>

                <div className="gallery-view__filters">
                    <div className="date-input-group">
                        <Calendar size={14} className="input-icon" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            placeholder="Start Date"
                            className="gallery-date-input"
                        />
                    </div>
                    <span className="date-separator">to</span>
                    <div className="date-input-group">
                        <Calendar size={14} className="input-icon" />
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            placeholder="End Date"
                            className="gallery-date-input"
                        />
                    </div>
                    {(dateRange.start || dateRange.end) && (
                        <button
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="clear-btn"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </header>

            {photos.length === 0 && !loading ? (
                <EmptyState
                    variant="noPhotos"
                    message={dateRange.start || dateRange.end ? "Try adjusting your date range" : undefined}
                />
            ) : (
                <>
                    <PhotoGrid
                        photos={photos}
                        onPhotoClick={handlePhotoClick}
                        loading={loading && photos.length === 0}
                    />

                    {hasMore && (
                        <button
                            className="gallery-view__load-more"
                            onClick={() => fetchPhotos(false)}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Load More'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default GalleryView;
