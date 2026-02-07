import { DependencyList } from 'react';
import useHotkeyManager from './useHotkeyManager';

type HotkeyCallback = (event: KeyboardEvent) => void;

/**
 * useHotkeys Hook - Thin wrapper around useHotkeyManager for backward compatibility
 * @param key - Key combination to listen for (e.g., 'c', 'Shift+K', '/')
 * @param callback - Function to execute when key is pressed
 * @param deps - Dependencies for the effect
 */
const useHotkeys = (key: string, callback: HotkeyCallback, deps: DependencyList = []): void => {
  useHotkeyManager(key, callback, deps);
};

export default useHotkeys;
