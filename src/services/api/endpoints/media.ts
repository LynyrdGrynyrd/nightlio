/**
 * Media endpoints
 */

import { ApiClient } from '../apiClient';
import { Media, GalleryResponse, GalleryQueryParams } from '../types';

export const createMediaEndpoints = (client: ApiClient) => ({
  /**
   * Upload media to an entry
   */
  uploadMedia: (entryId: number, file: File): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);
    return client.request<Media>(`/api/mood/${entryId}/media`, {
      method: 'POST',
      headers: {
        // multipart/form-data is set automatically by fetch when body is FormData
        'Content-Type': undefined as unknown as string,
      },
      body: formData as unknown as string,
    });
  },

  /**
   * Get media for an entry
   */
  getEntryMedia: (entryId: number): Promise<Media[]> => {
    return client.request<Media[]>(`/api/mood/${entryId}/media`);
  },

  /**
   * Delete media
   */
  deleteMedia: (mediaId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get gallery photos
   */
  getGalleryPhotos: ({
    limit = 50,
    offset = 0,
    startDate,
    endDate,
  }: GalleryQueryParams = {}): Promise<GalleryResponse> => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return client.request<GalleryResponse>(`/api/media/gallery?${params.toString()}`);
  },
});
