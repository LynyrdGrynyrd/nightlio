import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GalleryView from './GalleryView';

vi.mock('../services/api', () => ({
  default: {
    getGalleryPhotos: vi.fn(),
  },
}));

import apiService from '../services/api';

describe('GalleryView', () => {
  beforeEach(() => {
    apiService.getGalleryPhotos.mockResolvedValue({
      photos: [],
      total: 0,
      has_more: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no photos', async () => {
    render(<GalleryView onEntryClick={vi.fn()} />);

    expect(await screen.findByText('Gallery is empty')).toBeInTheDocument();
  });
});
