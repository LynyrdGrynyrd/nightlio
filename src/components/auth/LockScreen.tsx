import { useState } from 'react';
import PinPad from './PinPad';
import { useLock } from '../../contexts/LockContext';
import apiService from '../../services/api';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

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
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <Card className="border-0 shadow-none bg-transparent text-center">
        <CardHeader className="items-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Lock size={32} />
          </div>
          <CardTitle className="text-2xl">Locked</CardTitle>
          <CardDescription>Enter your PIN to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <PinPad
            onComplete={handlePinComplete}
            length={4}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LockScreen;
