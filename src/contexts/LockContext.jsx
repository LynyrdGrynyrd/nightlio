import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

const LockContext = createContext(null);

export const useLock = () => {
    const context = useContext(LockContext);
    if (!context) {
        throw new Error('useLock must be used within a LockProvider');
    }
    return context;
};

export const LockProvider = ({ children }) => {
    const { user } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [lockTimeout, setLockTimeout] = useState(60); // Default 60s
    const lastActivity = useRef(Date.now()); // Use ref to avoid re-renders on every event

    const checkIntervalRef = useRef(null);

    // Fetch settings on mount/user change
    useEffect(() => {
        if (user) {
            apiService.getUserSettings().then(settings => {
                setHasPin(settings.has_pin);
                setLockTimeout(settings.lock_timeout_seconds || 60);

                // If loaded and has pin, start locked? 
                // Decision: Only lock if explicitly timed out or fresh session?
                // For now, let's NOT lock on refresh unless we implement session persist logic.
                // But security-wise, refresh SHOULD lock if PIN enabled.
                // Let's assume refresh = new session = lock.
                if (settings.has_pin) {
                    // Check if we have a "was_unlocked" flag in sessionStorage
                    const wasUnlocked = sessionStorage.getItem('twilightio_unlocked');
                    if (!wasUnlocked) {
                        setIsLocked(true);
                    }
                }
            }).catch(console.error);
        } else {
            setHasPin(false);
            setIsLocked(false);
        }
    }, [user]);

    const lockApp = useCallback(() => {
        if (hasPin && !isLocked) {
            setIsLocked(true);
            sessionStorage.removeItem('twilightio_unlocked');
        }
    }, [hasPin, isLocked]);

    const unlockApp = useCallback(() => {
        setIsLocked(false);
        lastActivity.current = Date.now();
        sessionStorage.setItem('twilightio_unlocked', 'true');
    }, []);

    const resetTimer = useCallback(() => {
        lastActivity.current = Date.now();
    }, []);

    // Monitoring Activity
    useEffect(() => {
        if (!user || !hasPin || isLocked) return;

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        const handleActivity = () => resetTimer();

        // Use passive listeners for better performance on scroll/touchstart
        events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

        // Interval to check timeout
        checkIntervalRef.current = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity.current > lockTimeout * 1000) {
                lockApp();
            }
        }, 5000); // Check every 5s

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        };
    }, [user, hasPin, isLocked, lockTimeout, lockApp, resetTimer]);

    // Visibility change handler (lock immediately if backgrounded for X time? Not implemented yet)

    // Refresh settings helper
    const refreshSettings = async () => {
        if (!user) return;
        const settings = await apiService.getUserSettings();
        setHasPin(settings.has_pin);
        setLockTimeout(settings.lock_timeout_seconds || 60);
    };

    const value = {
        isLocked,
        hasPin,
        unlockApp,
        lockApp, // Manual lock
        refreshSettings
    };

    return (
        <LockContext.Provider value={value}>
            {children}
        </LockContext.Provider>
    );
};
