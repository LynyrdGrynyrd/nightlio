import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { THEME_MIGRATION_V2, ThemeProvider, useTheme } from './ThemeContext';

const Harness = () => {
  const { theme, setTheme, cycle } = useTheme();
  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <button type="button" onClick={() => setTheme('night-journal')}>
        Select Night Journal
      </button>
      <button type="button" onClick={cycle}>
        Cycle Theme
      </button>
    </div>
  );
};

describe('ThemeContext migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('forces wellness-day during migration and stores migration marker', async () => {
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('wellness-day');
    });

    expect(localStorage.getItem(STORAGE_KEYS.THEME_MIGRATION_V2)).toBe(THEME_MIGRATION_V2);
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('wellness-day');
  });

  it('keeps persisted theme after migration marker is present', async () => {
    localStorage.setItem(STORAGE_KEYS.THEME_MIGRATION_V2, THEME_MIGRATION_V2);
    localStorage.setItem(STORAGE_KEYS.THEME, 'night-journal');

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('night-journal');
    });
  });

  it('persists manual theme updates after migration', async () => {
    localStorage.setItem(STORAGE_KEYS.THEME_MIGRATION_V2, THEME_MIGRATION_V2);
    localStorage.setItem(STORAGE_KEYS.THEME, 'wellness-day');

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Night Journal' }));

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('night-journal');
    });
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('night-journal');
  });

  it('cycles through primary and legacy themes in order', async () => {
    localStorage.setItem(STORAGE_KEYS.THEME_MIGRATION_V2, THEME_MIGRATION_V2);
    localStorage.setItem(STORAGE_KEYS.THEME, 'wellness-day');

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    );

    const expected = [
      'night-journal',
      'oled',
      'light',
      'dark',
      'ocean',
      'forest',
      'sunset',
      'lavender',
      'midnight',
      'wellness-day',
    ];

    for (const themeId of expected) {
      fireEvent.click(screen.getByRole('button', { name: 'Cycle Theme' }));
      await waitFor(() => {
        expect(screen.getByTestId('active-theme')).toHaveTextContent(themeId);
      });
    }
  });
});
