import { useState } from 'react';
import PinPad from './PinPad';
import { useLock } from '../../contexts/LockContext';
import apiService from '../../services/api';
import { Lock } from 'lucide-react';

// ========== Component ==========

const LockScreen = () => {
  const { isLocked, unlockApp } = useLock();
  const [error, setError] = useState('');

  if (!isLocked) return null;

  const handlePinComplete = async (pin: string) => {
    setError('');

    try {
      const result = await apiService.verifyPin(pin);
      if (result.valid) {
        unlockApp();
      } else {
        setError('Incorrect PIN');
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] flex flex-col items-center justify-center animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-bg-soft)] flex items-center justify-center text-[var(--accent-500)] mb-2">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Locked</h2>
        <p className="text-[var(--text-muted)]">Enter your PIN to continue</p>
      </div>

      <PinPad
        onComplete={handlePinComplete}
        length={4}
        error={error}
      />
    </div>
  );
};

export default LockScreen;
