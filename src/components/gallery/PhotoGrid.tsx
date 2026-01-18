import { KeyboardEvent } from 'react';
import './PhotoGrid.css';

// ========== Types ==========

interface Photo {
  id: number;
  entry_id: number;
  file_path: string;
  thumbnail_path?: string;
  file_type: string;
  entry_date: string;
  entry_mood: number;
  created_at: string;
}

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
  loading: boolean;
}

// ========== Constants ==========

const MOOD_COLORS: Record<number, string> = {
  1: 'var(--mood-1)',
  2: 'var(--mood-2)',
  3: 'var(--mood-3)',
  4: 'var(--mood-4)',
  5: 'var(--mood-5)',
};

// ========== Component ==========

const PhotoGrid = ({ photos, onPhotoClick, loading }: PhotoGridProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, photo: Photo) => {
    if (e.key === 'Enter') {
      onPhotoClick(photo);
    }
  };

  if (loading) {
    return (
      <div className="photo-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="photo-grid__skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="photo-grid">
      {photos.map(photo => (
        <div
          key={photo.id}
          className="photo-grid__item"
          onClick={() => onPhotoClick(photo)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, photo)}
          style={{ '--mood-color': MOOD_COLORS[photo.entry_mood] || MOOD_COLORS[3] } as React.CSSProperties}
        >
          <img
            src={`/api/media/${photo.thumbnail_path || photo.file_path}`}
            alt={`Entry from ${photo.entry_date}`}
            loading="lazy"
            className="photo-grid__image"
          />
          <div className="photo-grid__overlay">
            <span className="photo-grid__date">{photo.entry_date}</span>
            <span className="photo-grid__mood-indicator" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;
