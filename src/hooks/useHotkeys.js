
import { useEffect } from 'react';

/**
 * useHotkeys Hook
 * @param {string} key - Key combination to listen for (e.g., 'c', 'Shift+K', '/')
 * @param {function} callback - Function to execute when key is pressed
 * @param {Array} deps - Dependencies for the effect
 */
const useHotkeys = (key, callback, deps = []) => {
    useEffect(() => {
        const handler = (event) => {
            // Logic to detect key combo
            if (globalNavDisabled(event)) return;

            const keys = key.split('+').map(k => k.trim().toLowerCase());
            const eventKey = event.key.toLowerCase();

            const modifiers = {
                ctrl: event.ctrlKey,
                shift: event.shiftKey,
                alt: event.altKey,
                meta: event.metaKey
            };

            // Check modifiers
            const requiredModifiers = keys.filter(k => ['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(k));
            const mainKey = keys.find(k => !['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(k));

            // Map 'cmd' to meta
            const hasMeta = requiredModifiers.includes('cmd') || requiredModifiers.includes('meta');
            const hasCtrl = requiredModifiers.includes('ctrl');
            const hasShift = requiredModifiers.includes('shift');
            const hasAlt = requiredModifiers.includes('alt');

            if (
                modifiers.meta === hasMeta &&
                modifiers.ctrl === hasCtrl &&
                modifiers.shift === hasShift &&
                modifiers.alt === hasAlt &&
                (mainKey === eventKey || (mainKey === '/' && eventKey === '/'))
            ) {
                event.preventDefault();
                callback(event);
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [key, ...deps]);
};

// Helper to ignore input fields
const globalNavDisabled = (e) => {
    const target = e.target;
    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );
};

export default useHotkeys;
