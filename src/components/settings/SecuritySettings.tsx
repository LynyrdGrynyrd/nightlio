import { useState, useEffect } from 'react';
import { useLock } from '../../contexts/LockContext';
import apiService from '../../services/api';
import PinPad from '../auth/PinPad';
import { Shield, Lock, Unlock, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

// ========== Types ==========

type SecurityMode = 'view' | 'setup' | 'confirm' | 'remove' | 'delete_confirm';

interface UserSettings {
  lock_timeout_seconds: number;
}

// ========== Component ==========

const SecuritySettings = () => {
  const { hasPin, refreshSettings } = useLock();
  const { show } = useToast();
  const [mode, setMode] = useState<SecurityMode>('view');
  const [tempPin, setTempPin] = useState('');
  const [error, setError] = useState('');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await apiService.getUserSettings();
    setUserSettings(settings);
  };

  const handleSetPin = async (pin: string) => {
    setError('');

    if (mode === 'setup') {
      setTempPin(pin);
      setMode('confirm');
    } else if (mode === 'confirm') {
      if (pin === tempPin) {
        try {
          await apiService.setPin(pin);
          await refreshSettings();
          show('PIN set successfully', 'success');
          setMode('view');
        } catch {
          show('Failed to set PIN', 'error');
        }
      } else {
        setError('PINs do not match');
      }
    }
  };

  const handleVerifyToRemove = async (pin: string) => {
    try {
      const result = await apiService.verifyPin(pin);
      if (result.valid) {
        await apiService.removePin();
        await refreshSettings();
        show('Lock removed', 'success');
        setMode('view');
      } else {
        setError('Incorrect PIN');
      }
    } catch {
      setError('Verification failed');
    }
  };

  const handleTimeoutChange = async (value: string) => {
    const seconds = parseInt(value);
    try {
      await apiService.updateLockTimeout(seconds);
      await refreshSettings();
      loadSettings();
      show('Timeout updated', 'success');
    } catch {
      show('Failed to update timeout', 'error');
    }
  };

  if (mode === 'setup' || mode === 'confirm') {
    return (
      <div className="max-w-md mx-auto py-8">
        <h3 className="text-xl font-bold mb-6 text-center">
          {mode === 'setup' ? 'Create a PIN' : 'Confirm your PIN'}
        </h3>
        <PinPad
          onComplete={handleSetPin}
          error={error}
          length={4}
        />
        <Button
          variant="link"
          onClick={() => setMode('view')}
          className="block mx-auto mt-8"
        >
          Cancel
        </Button>
      </div>
    );
  }

  if (mode === 'remove') {
    return (
      <div className="max-w-md mx-auto py-8">
        <h3 className="text-xl font-bold mb-6 text-center">Enter PIN to Disable</h3>
        <PinPad
          onComplete={handleVerifyToRemove}
          error={error}
          length={4}
        />
        <Button
          variant="link"
          onClick={() => setMode('view')}
          className="block mx-auto mt-8"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className={`p-3 rounded-full ${hasPin ? 'bg-[color:var(--success-soft)] text-[color:var(--success)]' : 'bg-muted text-muted-foreground'}`}>
                {hasPin ? <Lock size={24} /> : <Unlock size={24} />}
              </div>
              <div>
                <h3 className="font-semibold text-lg">App Lock</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {hasPin
                    ? 'Your journal is protected with a PIN.'
                    : 'Secure your journal with a 4-digit PIN.'}
                </p>
              </div>
            </div>

            <Button
              variant={hasPin ? "destructive" : "default"}
              onClick={() => setMode(hasPin ? 'remove' : 'setup')}
            >
              {hasPin ? 'Disable Lock' : 'Enable Lock'}
            </Button>
          </div>

          {hasPin && userSettings && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-muted-foreground" />
                  <span className="font-medium">Auto-lock timeout</span>
                </div>
                <Select
                  value={String(userSettings.lock_timeout_seconds)}
                  onValueChange={handleTimeoutChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Immediately</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="opacity-60 pointer-events-none grayscale">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-muted text-muted-foreground">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Biometric Unlock</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Browser support coming soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle size={20} /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardDescription className="text-destructive/80">
              Permanently delete your account and all data. This action cannot be undone.
            </CardDescription>
            <Button
              variant="destructive"
              onClick={() => setMode('delete_confirm')}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
