import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SecuritySettings from './SecuritySettings';

const refreshSettings = vi.fn();
const show = vi.fn();

vi.mock('../../contexts/LockContext', () => ({
  useLock: () => ({
    hasPin: false,
    refreshSettings,
  }),
}));

vi.mock('../../services/api', () => ({
  default: {
    getUserSettings: vi.fn(() => Promise.resolve({ lock_timeout_seconds: 60 })),
    setPin: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../ui/ToastProvider', () => ({
  useToast: () => ({ show }),
}));

vi.mock('../auth/PinPad', () => ({
  default: ({ onComplete }: { onComplete: (pin: string) => void }) => (
    <button type="button" onClick={() => onComplete('1234')}>
      Mock PinPad
    </button>
  ),
}));

import apiService from '../../services/api';

describe('SecuritySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows setting a PIN with confirmation', async () => {
    render(<SecuritySettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Enable Lock' }));

    expect(screen.getByText('Create a PIN')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock PinPad' }));

    expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock PinPad' }));

    await waitFor(() => {
      expect(apiService.setPin).toHaveBeenCalledWith('1234');
      expect(refreshSettings).toHaveBeenCalled();
      expect(show).toHaveBeenCalledWith('PIN set successfully', 'success');
    });
  });
});
