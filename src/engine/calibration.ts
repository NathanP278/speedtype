export interface UserCalibration {
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  timestamp: number;
}

const STORAGE_KEY = 'speedtype_user_calibration';

export function getStoredCalibration(): UserCalibration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserCalibration;
    if (typeof parsed.netWpm === 'number' && parsed.netWpm > 0) {
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
 * Calculates Gross WPM: (all keystrokes / 5) / elapsed minutes
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
 * Calculates Actual / Net WPM considering accuracy:
 * Standard typing formula: ((correct keystrokes / 5) - uncorrected errors) / elapsed minutes
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
