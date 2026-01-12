import { useState } from 'react';
import PinPad from './PinPad';
import { useLock } from '../../contexts/LockContext';
import apiService from '../../services/api';
import { Lock } from 'lucide-react';

const LockScreen = () => {
    const { isLocked, unlockApp } = useLock();
    const [error, setError] = useState('');

    // If not locked, don't render
    // However, better to render conditionally in parent to avoid z-index wars?
    // We'll use a portal or fixed full screen here.
    if (!isLocked) return null;

    const handlePinComplete = async (pin) => {
        // setIsVerifying(true);
        setError('');

        try {
            const result = await apiService.verifyPin(pin);
            if (result.valid) {
                unlockApp();
            } else {
                setError('Incorrect PIN');
                // Haptic feedback if supported?
                if (navigator.vibrate) navigator.vibrate(200);
            }
        } catch (err) {
            console.error(err);
            setError('Verification failed');
        } finally {
            // setIsVerifying(false);
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

            {/* Escape hatch? Logout button? */}
        </div>
    );
};

export default LockScreen;
