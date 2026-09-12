export type CalibrationDeviceCategory = 'mobile' | 'tablet' | 'desktop';

export interface UserCalibration {
  netWpm: number;
  rawWpm: number;    // Gross WPM — all keystrokes / 5 / minutes (before accuracy penalty)
  grossWpm: number;  // Alias kept for backwards-compat
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  timestamp: number;
  deviceCategory?: CalibrationDeviceCategory;
  deviceFormFactor?: string;
  deviceOs?: string;
}

export interface LastCalibratedDeviceInfo {
  category: CalibrationDeviceCategory;
  formFactor: string;
  os?: string;
  timestamp: number;
}

const STORAGE_KEY = 'speedtype_user_calibration';
const DEVICE_MAP_STORAGE_KEY = 'speedtype_device_calibrations_map';
const LAST_DEVICE_STORAGE_KEY = 'speedtype_last_calibrated_device';

/** Per-word reading recognition margin deducted from elapsed time in reading-adjusted WPM. */
export const READING_MARGIN_MS = 50;

/**
 * Retrieve stored calibrations map for all hardware categories.
 */
export function getDeviceCalibrationsMap(): Partial<Record<CalibrationDeviceCategory, UserCalibration>> {
  try {
    const raw = localStorage.getItem(DEVICE_MAP_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<CalibrationDeviceCategory, UserCalibration>>;
  } catch {
    return {};
  }
}

export function normalizeCalibrationCategory(category?: string): CalibrationDeviceCategory {
  if (category === 'mobile' || category === 'tablet') {
    return category;
  }
  return 'desktop';
}

/**
 * Retrieve stored calibration for a specific device category or active fallback.
 */
export function getStoredCalibration(category?: CalibrationDeviceCategory): UserCalibration | null {
  try {
    // If specific device category requested, check device map first
    if (category) {
      const map = getDeviceCalibrationsMap();
      if (map[category] && typeof map[category]!.netWpm === 'number') {
        const cal = map[category]!;
        if (typeof cal.rawWpm !== 'number') {
          cal.rawWpm = cal.grossWpm ?? cal.netWpm;
        }
        return cal;
      }
    }

    // Check primary storage key
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserCalibration;
    if (typeof parsed.netWpm === 'number' && parsed.netWpm > 0) {
      if (typeof parsed.rawWpm !== 'number') {
        parsed.rawWpm = parsed.grossWpm ?? parsed.netWpm;
      }
      // If a category was requested and legacy record has a mismatched category, return null
      if (category && parsed.deviceCategory && parsed.deviceCategory !== category) {
        return null;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export const getDeviceCalibration = getStoredCalibration;

/**
 * Get information on the last device that completed calibration.
 */
export function getLastCalibratedDeviceInfo(): LastCalibratedDeviceInfo | null {
  try {
    const raw = localStorage.getItem(LAST_DEVICE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastCalibratedDeviceInfo;
  } catch {
    return null;
  }
}

/**
 * Check if the current device has a calibration mismatch or requires fresh calibration.
 */
export function checkDeviceCalibrationMismatch(
  currentCategory: CalibrationDeviceCategory,
  currentFormFactor: string = 'Current Device'
): {
  hasMismatch: boolean;
  requiresCalibration: boolean;
  previousDevice?: string;
  currentDevice?: string;
} {
  const currentCal = getStoredCalibration(currentCategory);
  const lastDevice = getLastCalibratedDeviceInfo();

  if (!currentCal) {
    if (lastDevice && lastDevice.category !== currentCategory) {
      return {
        hasMismatch: true,
        requiresCalibration: true,
        previousDevice: lastDevice.formFactor || lastDevice.category,
        currentDevice: currentFormFactor,
      };
    }
    return {
      hasMismatch: false,
      requiresCalibration: true,
      currentDevice: currentFormFactor,
    };
  }

  return {
    hasMismatch: false,
    requiresCalibration: false,
    currentDevice: currentFormFactor,
  };
}

/**
 * Save calibration associated with the current device hardware profile.
 */
export function saveCalibration(
  calibration: UserCalibration,
  deviceProfile?: { category: CalibrationDeviceCategory; formFactor?: string; os?: string }
): void {
  try {
    const targetCategory = deviceProfile?.category || calibration.deviceCategory || 'desktop';
    const formFactor = deviceProfile?.formFactor || calibration.deviceFormFactor || 'Standard Device';
    const os = deviceProfile?.os || calibration.deviceOs;

    const enrichedCal: UserCalibration = {
      ...calibration,
      deviceCategory: targetCategory,
      deviceFormFactor: formFactor,
      deviceOs: os,
    };

    // Update primary storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enrichedCal));

    // Update per-device category map
    const map = getDeviceCalibrationsMap();
    map[targetCategory] = enrichedCal;
    localStorage.setItem(DEVICE_MAP_STORAGE_KEY, JSON.stringify(map));

    // Update last calibrated device
    const lastDevice: LastCalibratedDeviceInfo = {
      category: targetCategory,
      formFactor,
      os,
      timestamp: Date.now(),
    };
    localStorage.setItem(LAST_DEVICE_STORAGE_KEY, JSON.stringify(lastDevice));
  } catch (err) {
    console.error('Failed to save calibration to localStorage', err);
  }
}

export function clearCalibration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEVICE_MAP_STORAGE_KEY);
    localStorage.removeItem(LAST_DEVICE_STORAGE_KEY);
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
  correctKeystrokes: number,
  wordsCompleted: number,
  elapsedSeconds: number
): number {
  if (wordsCompleted <= 0 || elapsedSeconds <= 0) return 0;
  const standardWords = correctKeystrokes / 5;
  const readingDeductionSec = (wordsCompleted * READING_MARGIN_MS) / 1000;
  const effectiveSec = Math.max(0.5, elapsedSeconds - readingDeductionSec);
  const effectiveMin = effectiveSec / 60;
  return Math.max(0, Math.round(standardWords / effectiveMin));
}
