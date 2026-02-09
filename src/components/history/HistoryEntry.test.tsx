import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HistoryEntry from './HistoryEntry';
import { ToastProvider } from '../ui/ToastProvider';
import type { HistoryEntry as HistoryEntryType } from '../../types/entry';

vi.mock('./EntryModal', () => ({
  default: () => null,
}));

vi.mock('../ui/ConfirmDialog', () => ({
  default: () => null,
}));

describe('HistoryEntry key stability', () => {
  it('does not emit React unique-key warnings for duplicate-prone hydrated arrays', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const entry: HistoryEntryType = {
      id: 42,
      date: '2026-02-07',
      mood: 4,
      content: 'A solid day.',
      media: [
        { id: 10, entry_id: 42, file_path: 'first.jpg', file_type: 'image/jpeg', created_at: '2026-02-07T10:00:00Z' },
        { id: 10, entry_id: 42, file_path: 'second.jpg', file_type: 'image/jpeg', created_at: '2026-02-07T10:01:00Z' },
      ],
      selections: [
        { id: 55, name: 'Focused', icon: 'zap', group_id: 1, order_index: 0 },
        { id: 55, name: 'Focused', icon: 'zap', group_id: 1, order_index: 1 },
      ],
      scale_entries: [
        { scale_id: 7, name: 'Energy', value: 6, color_hex: '#22c55e' },
        { scale_id: 7, name: 'Energy', value: 7, color_hex: '#22c55e' },
      ],
    };

    render(
      <ToastProvider>
        <HistoryEntry entry={entry} onDelete={vi.fn()} />
      </ToastProvider>,
    );

    const hasUniqueKeyWarning = errorSpy.mock.calls.some((args) => {
      const message = args[0];
      return typeof message === 'string' && message.includes('Each child in a list should have a unique "key" prop');
    });

    expect(hasUniqueKeyWarning).toBe(false);
    errorSpy.mockRestore();
  });
});
