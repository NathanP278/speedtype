export interface UserCalibration {
  netWpm: number;
  rawWpm: number;    // Gross WPM — all keystrokes / 5 / minutes (before accuracy penalty)
  grossWpm: number;  // Alias kept for backwards-compat
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  timestamp: number;
}

const STORAGE_KEY = 'speedtype_user_calibration';

/** Per-word reading recognition margin deducted from elapsed time in reading-adjusted WPM. */
export const READING_MARGIN_MS = 50;

export function getStoredCalibration(): UserCalibration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserCalibration;
    if (typeof parsed.netWpm === 'number' && parsed.netWpm > 0) {
      // Backfill rawWpm for old saves that lack the field
      if (typeof parsed.rawWpm !== 'number') {
        parsed.rawWpm = parsed.grossWpm ?? parsed.netWpm;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCalibration(calibration: UserCalibration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calibration));
  } catch (err) {
    console.error('Failed to save calibration to localStorage', err);
  }
}

export function clearCalibration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear calibration', err);
  }
}

/**
 * Calculates Raw (Gross) WPM: (all keystrokes / 5) / elapsed minutes.
 * Does NOT account for accuracy — measures raw finger speed only.
 */
export function calculateGrossWpm(totalKeystrokes: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0;
  const elapsedMinutes = elapsedSeconds / 60;
  return Math.round((totalKeystrokes / 5) / elapsedMinutes);
}

/**
 * Calculates Accuracy: (correctKeystrokes / totalKeystrokes) * 100
 */
export function calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100)));
}

/**
 * Calculates Actual / Net WPM considering accuracy.
 * Standard formula: ((correct keystrokes / 5) - uncorrected errors) / elapsed minutes.
 * Never drops below 0.
 */
export function calculateNetWpm(
  correctKeystrokes: number,
  errors: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0) return 0;
  const elapsedMinutes = elapsedSeconds / 60;
  const rawNetWpm = ((correctKeystrokes / 5) - errors) / elapsedMinutes;
  return Math.max(0, Math.round(rawNetWpm));
}

/**
 * Adjusts WPM to account for per-word reading recognition time.
 * Subtracts READING_MARGIN_MS per completed word from elapsed time.
 * Prevents WPM from over-inflating for slow, careful readers who spend
 * time reading each word before their fingers start moving.
 */
export function calculateReadingAdjustedWpm(
  wordsCompleted: number,
  elapsedSeconds: number
): number {
  if (wordsCompleted <= 0 || elapsedSeconds <= 0) return 0;
  const readingDeductionSec = (wordsCompleted * READING_MARGIN_MS) / 1000;
  const effectiveSec = Math.max(0.5, elapsedSeconds - readingDeductionSec);
  const effectiveMin = effectiveSec / 60;
  return Math.max(0, Math.round(wordsCompleted / effectiveMin));
}
