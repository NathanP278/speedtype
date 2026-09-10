/**
 * Haptic Sensory Polish Utility
 * Safe navigator.vibrate wrapper with defensive environment and policy checks.
 */

export const HAPTIC_PATTERNS = {
  MISTYPE: 40,
  BASELINE_IMPACT: [80, 40, 80] as const,
} as const;

/**
 * Triggers sensory vibration feedback using navigator.vibrate.
 * Safely handles desktop browsers, iOS Safari, and permissions policy restrictions.
 *
 * @param pattern Duration in milliseconds (e.g. 40) or an array of vibration/pause durations
 * @returns boolean indicating whether vibration was successfully dispatched
 */
export function triggerHapticFeedback(pattern: number | readonly number[] | number[]): boolean {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      return navigator.vibrate(pattern as number | number[]);
    } catch {
      // Silently swallow browser restrictions or permissions errors
      return false;
    }
  }
  return false;
}
