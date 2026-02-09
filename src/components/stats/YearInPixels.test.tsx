import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, THEME_MIGRATION_V2 } from '@/contexts/ThemeContext';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import YearInPixels from './YearInPixels';

const entries = [
  { id: 1, mood: 5, date: '2026-01-04' },
  { id: 2, mood: 3, date: '2026-01-05' },
  { id: 3, mood: 4, date: '2026-02-16' },
];

describe('YearInPixels', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.THEME_MIGRATION_V2, THEME_MIGRATION_V2);
    localStorage.setItem(STORAGE_KEYS.THEME, 'wellness-day');
  });

  it('defaults to landscape view and toggles to classic grid', () => {
    render(
      <ThemeProvider>
        <YearInPixels entries={entries} />
      </ThemeProvider>
    );

    expect(screen.getByRole('img', { name: /Mood landscape for/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Classic Grid/i }));
    expect(screen.getByText('Level 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Landscape/i }));
    expect(screen.getByRole('img', { name: /Mood landscape for/i })).toBeInTheDocument();
  });
});
