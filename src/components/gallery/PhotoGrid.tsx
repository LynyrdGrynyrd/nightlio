import { KeyboardEvent } from 'react';
import Skeleton from '../ui/Skeleton';
import { MOODS } from '../../utils/moodUtils';
import { API_BASE_URL } from '../../services/api';

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

// ========== Component ==========

const PhotoGrid = ({ photos, onPhotoClick, loading }: PhotoGridProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, photo: Photo) => {
    if (e.key === 'Enter') {
      onPhotoClick(photo);
    }
  };

  const getMoodColor = (moodId: number) => {
    return MOODS.find(m => m.value === moodId)?.color || 'var(--primary)';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
      {photos.map(photo => (
        <div
          key={photo.id}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-muted aspect-square transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
          onClick={() => onPhotoClick(photo)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, photo)}
        >
          <img
            src={`${API_BASE_URL}/api/media/${photo.thumbnail_path || photo.file_path}`}
            alt={`Entry from ${photo.entry_date}`}
            width={200}
            height={200}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
            <div className="flex items-center justify-between text-[color:var(--overlay-foreground)] text-xs font-medium">
              <span>{photo.entry_date}</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-[color:color-mix(in_oklab,var(--overlay-foreground),transparent_50%)]"
                style={{ backgroundColor: getMoodColor(photo.entry_mood) }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;
