import { useState, useEffect } from 'react';
import { useLock } from '../../contexts/LockContext';
import apiService from '../../services/api';
import PinPad from '../auth/PinPad';
import { Shield, Lock, Unlock, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';

const SecuritySettings = () => {
    const { hasPin, refreshSettings } = useLock();
    const { show } = useToast();
    const [mode, setMode] = useState('view'); // view | setup | verify | remove
    const [tempPin, setTempPin] = useState(''); // For setup confirmation step
    const [error, setError] = useState('');
    // const [isLoading, setIsLoading] = useState(false);
    const [userSettings, setUserSettings] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await apiService.getUserSettings();
        setUserSettings(settings);
    };

    const handleSetPin = async (pin) => {
        setError('');

        if (mode === 'setup') {
            // First entry
            setTempPin(pin);
            setMode('confirm');
        } else if (mode === 'confirm') {
            // Confirm entry
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
                // Allow retry immediately? Or reset to setup?
                // Let's reset to setup logic or just clear error on next type
            }
        }
    };

    const handleVerifyToRemove = async (pin) => {

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

    const handleTimeoutChange = async (e) => {
        const seconds = parseInt(e.target.value);
        try {
            await apiService.updateLockTimeout(seconds);
            await refreshSettings();
            loadSettings(); // refresh local state
            show('Timeout updated', 'success');
        } catch {
            show('Failed to update timeout', 'error');
        }
    };

    // UI for Setting New PIN
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
                <button
                    onClick={() => setMode('view')}
                    className="block mx-auto mt-8 text-[var(--accent-500)] text-sm font-medium hover:underline"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // UI for Removing PIN
    if (mode === 'remove') {
        return (
            <div className="max-w-md mx-auto py-8">
                <h3 className="text-xl font-bold mb-6 text-center">Enter PIN to Disable</h3>
                <PinPad
                    onComplete={handleVerifyToRemove}
                    error={error}
                    length={4}
                />
                <button
                    onClick={() => setMode('view')}
                    className="block mx-auto mt-8 text-[var(--accent-500)] text-sm font-medium hover:underline"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // Default View
    return (
        <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className={`p-3 rounded-full ${hasPin ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                            {hasPin ? <Lock size={24} /> : <Unlock size={24} />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-[var(--text)]">App Lock</h3>
                            <p className="text-[var(--text-muted)] text-sm mt-1">
                                {hasPin
                                    ? 'Your journal is protected with a PIN.'
                                    : 'Secure your journal with a 4-digit PIN.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setMode(hasPin ? 'remove' : 'setup')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${hasPin
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                            : 'bg-[var(--accent-bg)] text-white hover:opacity-90'
                            }`}
                    >
                        {hasPin ? 'Disable Lock' : 'Enable Lock'}
                    </button>
                </div>

                {hasPin && userSettings && (
                    <div className="mt-6 pt-6 border-t border-[var(--border)]">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-[var(--text-muted)]" />
                                <span className="text-[var(--text)] font-medium">Auto-lock timeout</span>
                            </div>
                            <select
                                value={userSettings.lock_timeout_seconds}
                                onChange={handleTimeoutChange}
                                className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent-500)] outline-none"
                            >
                                <option value={0}>Immediately</option>
                                <option value={30}>30 seconds</option>
                                <option value={60}>1 minute</option>
                                <option value={300}>5 minutes</option>
                                <option value={600}>10 minutes</option>
                            </select>
                        </label>
                    </div>
                )}
            </div>



            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 opacity-60 pointer-events-none grayscale">
                {/* Biometric Placeholder - Tier 2.4 future */}
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-[var(--text)]">Biometric Unlock</h3>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            Browser support coming soon.
                        </p>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
                <h3 className="text-red-600 dark:text-red-400 font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={20} /> Danger Zone
                </h3>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                        Permanently delete your account and all data. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setMode('delete_confirm')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition py-2"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div >
    );
};

export default SecuritySettings;
