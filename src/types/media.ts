/**
 * Media-related types
 */

import { Media } from '../services/api';

/**
 * Media file with preview URL for UI display
 */
export interface MediaPreview extends Media {
  previewUrl?: string;
}

/**
 * Check if media is an image type
 */
export const isImageMedia = (media: Media): boolean => {
  return media.file_type.startsWith('image/');
};

/**
 * Check if media is an audio type
 */
export const isAudioMedia = (media: Media): boolean => {
  return media.file_type.startsWith('audio/');
};

/**
 * Check if media is a video type
 */
export const isVideoMedia = (media: Media): boolean => {
  return media.file_type.startsWith('video/');
};

/**
 * Get media category from file type
 */
export const getMediaCategory = (media: Media): 'image' | 'audio' | 'video' | 'other' => {
  if (isImageMedia(media)) return 'image';
  if (isAudioMedia(media)) return 'audio';
  if (isVideoMedia(media)) return 'video';
  return 'other';
};
