import { useEffect, useCallback } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;

interface HotkeyEntry {
  callback: HotkeyCallback;
  priority: number;
}

// Global registry for hotkeys - single Map shared across all hook instances
const hotkeyRegistry = new Map<string, Set<HotkeyEntry>>();

// Track if the global listener is already attached
let listenerAttached = false;

// Reference count for active registrations to clean up listener when not needed
let registrationCount = 0;

// Helper to check if we should skip shortcuts (input fields, etc.)
const shouldSkipShortcut = (event: KeyboardEvent): boolean => {
  const target = event.target as HTMLElement | null;
  if (!target) return false;

  const tagName = target.tagName || '';
  if (/^(INPUT|TEXTAREA|SELECT)$/i.test(tagName)) {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target.closest?.('[contenteditable="true"]')) {
    return true;
  }

  // Check for MDX editor
  const markdownContainer = target.closest?.('.mdx-editor');
  if (markdownContainer) {
    const editableSurface = markdownContainer.querySelector(
      '[data-lexical-editor], [contenteditable="true"]'
    );
    if (editableSurface && editableSurface.contains(target)) {
      return true;
    }
  }

  return false;
};

// Build a normalized key string from a KeyboardEvent
const buildKeyString = (event: KeyboardEvent): string => {
  const parts: string[] = [];

  if (event.metaKey) parts.push('meta');
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');

  const key = event.key.toLowerCase();
  if (!['meta', 'control', 'alt', 'shift'].includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
};

// Normalize a key definition (e.g., "cmd+k" -> "meta+k")
const normalizeKeyDef = (keyDef: string): string => {
  return keyDef
    .toLowerCase()
    .split('+')
    .map(k => k.trim())
    .map(k => k === 'cmd' ? 'meta' : k)
    .sort((a, b) => {
      // Sort modifiers before the main key
      const modifiers = ['meta', 'ctrl', 'alt', 'shift'];
      const aIsModifier = modifiers.includes(a);
      const bIsModifier = modifiers.includes(b);
      if (aIsModifier && !bIsModifier) return -1;
      if (!aIsModifier && bIsModifier) return 1;
      return modifiers.indexOf(a) - modifiers.indexOf(b);
    })
    .join('+');
};

// Global keydown handler
const handleGlobalKeydown = (event: KeyboardEvent): void => {
  if (shouldSkipShortcut(event)) return;

  const keyString = buildKeyString(event);
  const entries = hotkeyRegistry.get(keyString);

  if (entries && entries.size > 0) {
    // Sort by priority (higher priority first) and call the highest priority handler
    const sortedEntries = Array.from(entries).sort((a, b) => b.priority - a.priority);
    const topEntry = sortedEntries[0];

    event.preventDefault();
    topEntry.callback(event);
  }
};

// Ensure the global listener is attached
const ensureListener = (): void => {
  if (typeof window === 'undefined' || listenerAttached) return;

  window.addEventListener('keydown', handleGlobalKeydown);
  listenerAttached = true;
};

// Clean up the global listener when no registrations remain
const cleanupListenerIfEmpty = (): void => {
  if (typeof window === 'undefined' || !listenerAttached) return;

  if (registrationCount <= 0 && hotkeyRegistry.size === 0) {
    window.removeEventListener('keydown', handleGlobalKeydown);
    listenerAttached = false;
    registrationCount = 0;
  }
};

/**
 * Register a hotkey with the global manager
 * @param keyDef - Key combination (e.g., 'c', 'cmd+k', 'shift+/')
 * @param callback - Function to call when key is pressed
 * @param priority - Higher priority handlers are called first (default: 0)
 * @returns Unregister function
 */
export const registerHotkey = (
  keyDef: string,
  callback: HotkeyCallback,
  priority: number = 0
): (() => void) => {
  ensureListener();

  const normalizedKey = normalizeKeyDef(keyDef);
  const entry: HotkeyEntry = { callback, priority };

  if (!hotkeyRegistry.has(normalizedKey)) {
    hotkeyRegistry.set(normalizedKey, new Set());
  }

  hotkeyRegistry.get(normalizedKey)!.add(entry);
  registrationCount++;

  // Return unregister function
  return () => {
    const entries = hotkeyRegistry.get(normalizedKey);
    if (entries) {
      entries.delete(entry);
      registrationCount--;
      if (entries.size === 0) {
        hotkeyRegistry.delete(normalizedKey);
      }
    }
    // Clean up global listener if no more registrations
    cleanupListenerIfEmpty();
  };
};

/**
 * React hook for registering hotkeys
 * Automatically cleans up when component unmounts
 *
 * @param keyDef - Key combination (e.g., 'c', 'cmd+k', 'shift+/')
 * @param callback - Function to call when key is pressed
 * @param deps - Dependencies array for the callback
 * @param priority - Higher priority handlers are called first (default: 0)
 */
const useHotkeyManager = (
  keyDef: string,
  callback: HotkeyCallback,
  deps: React.DependencyList = [],
  priority: number = 0
): void => {
  // Memoize the callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    const unregister = registerHotkey(keyDef, memoizedCallback, priority);
    return unregister;
  }, [keyDef, memoizedCallback, priority]);
};

export default useHotkeyManager;
