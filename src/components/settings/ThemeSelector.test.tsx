import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { THEME_MIGRATION_V2 } from '@/contexts/ThemeContext';
import ThemeSelector from './ThemeSelector';

describe('ThemeSelector', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.THEME_MIGRATION_V2, THEME_MIGRATION_V2);
    localStorage.setItem(STORAGE_KEYS.THEME, 'wellness-day');
  });

  it('renders primary and legacy sections', () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('More Themes')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Wellness Day/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Night Journal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OLED/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ocean/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Midnight/i })).toBeInTheDocument();
  });

  it('updates selected theme when a legacy theme is chosen', async () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Ocean/i }));

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('ocean');
    });
  });
});
