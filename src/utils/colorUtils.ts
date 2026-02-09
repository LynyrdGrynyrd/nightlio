/**
 * Color resolution and normalization utilities for CSS custom property tokens.
 */

/**
 * Resolves a CSS custom property token (e.g. "var(--mood-1)") to its computed value.
 * Returns the original value if it's not a CSS variable or if running in SSR.
 */
export function resolveColorToken(value: string): string {
  if (typeof window === 'undefined') return value;
  if (!value.startsWith('var(')) return value;
  const varName = value.slice(4, -1);
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || value;
}

/**
 * Normalizes a color value to a canonical hex format using a canvas context.
 * Handles CSS custom property tokens by resolving them first.
 */
export function normalizeColorValue(value: string): string {
  const resolved = resolveColorToken(value);
  if (typeof window === 'undefined') return resolved;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return resolved;
  ctx.fillStyle = resolved;
  return ctx.fillStyle;
}
