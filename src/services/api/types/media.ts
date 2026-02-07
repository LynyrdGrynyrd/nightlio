/**
 * Media types
 */

export interface Media {
  id: number;
  entry_id: number;
  file_path: string;
  file_type: string;
  created_at: string;
  thumbnail_path?: string;
}

export interface GalleryPhoto extends Media {
  entry_date: string;
  entry_mood: number;
}

export interface GalleryResponse {
  photos: GalleryPhoto[];
  total: number;
  has_more: boolean;
}

export interface GalleryQueryParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}
