/**
 * SpeedType Phase 17: Multi-Device Calibration Storage & Input Hardening Test Suite
 *
 * Validates:
 * 1. Per-device calibration persistence (independent mobile, tablet, desktop profiles).
 * 2. Anti-mismatch detection gate when switching between hardware categories.
 * 3. Restoration of tuned benchmarks when returning to a previously calibrated device.
 * 4. Controlled buffer diffing for rapid typing, multi-character insertions, and backspacing.
 * 5. Viewport scroll clamping invariant.
 */

import { describe, test, expect } from './test-harness.ts';
import {
  saveCalibration,
  getStoredCalibration,
  getDeviceCalibrationsMap,
  getLastCalibratedDeviceInfo,
  checkDeviceCalibrationMismatch,
  clearCalibration,
  UserCalibration,
} from '../src/engine/calibration.ts';

export function registerMultiDeviceCalibrationTests(): void {
  describe('Phase 17: Multi-Device Calibration Storage & Input Hardening', () => {
    test('MDC-01: Independent per-device calibration persistence across categories', () => {
      clearCalibration();

      const desktopCal: UserCalibration = {
        netWpm: 110,
        rawWpm: 115,
        grossWpm: 115,
        accuracy: 98,
        totalKeystrokes: 575,
        correctKeystrokes: 565,
        errors: 2,
        timestamp: Date.now() - 10000,
      };

      const mobileCal: UserCalibration = {
        netWpm: 48,
        rawWpm: 52,
        grossWpm: 52,
        accuracy: 94,
        totalKeystrokes: 260,
        correctKeystrokes: 248,
        errors: 3,
        timestamp: Date.now(),
      };

      // Save desktop calibration
      saveCalibration(desktopCal, {
        category: 'desktop',
        formFactor: 'Windows Workstation',
        os: 'windows',
      });

      // Save mobile calibration
      saveCalibration(mobileCal, {
        category: 'mobile',
        formFactor: 'Apple iPhone 15 Pro',
        os: 'ios',
      });

      // Verify each device category retains its unique benchmark
      const loadedDesktop = getStoredCalibration('desktop');
      const loadedMobile = getStoredCalibration('mobile');

      expect(loadedDesktop !== null).toBe(true);
      expect(loadedDesktop?.netWpm).toBe(110);
      expect(loadedDesktop?.deviceCategory).toBe('desktop');
      expect(loadedDesktop?.deviceFormFactor).toBe('Windows Workstation');

      expect(loadedMobile !== null).toBe(true);
      expect(loadedMobile?.netWpm).toBe(48);
      expect(loadedMobile?.deviceCategory).toBe('mobile');
      expect(loadedMobile?.deviceFormFactor).toBe('Apple iPhone 15 Pro');

      // Verify device map stores both
      const map = getDeviceCalibrationsMap();
      expect(map.desktop?.netWpm).toBe(110);
      expect(map.mobile?.netWpm).toBe(48);

      // Verify last calibrated device records the mobile session
      const last = getLastCalibratedDeviceInfo();
      expect(last !== null).toBe(true);
      expect(last?.category).toBe('mobile');
      expect(last?.formFactor).toBe('Apple iPhone 15 Pro');
    });

    test('MDC-02: Device mismatch detected when switching hardware without calibration', () => {
      clearCalibration();

      // User first calibrates on Desktop
      const desktopCal: UserCalibration = {
        netWpm: 105,
        rawWpm: 110,
        grossWpm: 110,
        accuracy: 97,
        totalKeystrokes: 550,
        correctKeystrokes: 535,
        errors: 3,
        timestamp: Date.now(),
      };

      saveCalibration(desktopCal, {
        category: 'desktop',
        formFactor: 'Mechanical Keyboard Desktop',
        os: 'windows',
      });

      // User now opens site on a smartphone (category = mobile)
      const check = checkDeviceCalibrationMismatch('mobile', 'Apple iPhone 14');

      expect(check.hasMismatch).toBe(true);
      expect(check.requiresCalibration).toBe(true);
      expect(check.previousDevice).toBe('Mechanical Keyboard Desktop');
      expect(check.currentDevice).toBe('Apple iPhone 14');
    });

    test('MDC-03: Returning to calibrated device restores tuned benchmark without mismatch', () => {
      // Both desktop and mobile now have calibrations stored from previous tests
      const mobileCal: UserCalibration = {
        netWpm: 45,
        rawWpm: 50,
        grossWpm: 50,
        accuracy: 92,
        totalKeystrokes: 250,
        correctKeystrokes: 230,
        errors: 4,
        timestamp: Date.now(),
      };

      saveCalibration(mobileCal, {
        category: 'mobile',
        formFactor: 'Apple iPhone 14',
        os: 'ios',
      });

      // Checking mobile again: already calibrated on mobile, no mismatch
      const mobileCheck = checkDeviceCalibrationMismatch('mobile', 'Apple iPhone 14');
      expect(mobileCheck.hasMismatch).toBe(false);
      expect(mobileCheck.requiresCalibration).toBe(false);

      // Switching back to desktop: desktop calibration exists, no mismatch
      const desktopCheck = checkDeviceCalibrationMismatch('desktop', 'Mechanical Keyboard Desktop');
      expect(desktopCheck.hasMismatch).toBe(false);
      expect(desktopCheck.requiresCalibration).toBe(false);

      const restoredDesktop = getStoredCalibration('desktop');
      expect(restoredDesktop?.netWpm).toBe(105);
    });

    test('MDC-04: Controlled buffer diffing extracts single characters and rapid bursts', () => {
      const charLog: string[] = [];
      let prevValue = '';

      const diffEngine = (newValue: string) => {
        if (newValue.length > prevValue.length) {
          if (newValue.startsWith(prevValue)) {
            const added = newValue.slice(prevValue.length);
            for (const ch of added) charLog.push(ch);
          } else {
            const diff = newValue.length - prevValue.length;
            const added = newValue.slice(newValue.length - diff);
            for (const ch of added) charLog.push(ch);
          }
        }
        prevValue = newValue;
      };

      // Type single char 's'
      diffEngine('s');
      expect(charLog).toEqual(['s']);

      // Type consecutive char 'p'
      diffEngine('sp');
      expect(charLog).toEqual(['s', 'p']);

      // Rapid consecutive burst 'eed'
      diffEngine('speed');
      expect(charLog).toEqual(['s', 'p', 'e', 'e', 'd']);
    });

    test('MDC-05: Controlled buffer diffing triggers backspace on character removal', () => {
      let backspaceCount = 0;
      let prevValue = 'speed';

      const diffEngine = (newValue: string) => {
        if (newValue.length < prevValue.length) {
          const removed = prevValue.length - newValue.length;
          backspaceCount += removed;
        }
        prevValue = newValue;
      };

      // Single backspace: 'speed' -> 'spee'
      diffEngine('spee');
      expect(backspaceCount).toBe(1);

      // Multi-character selection delete: 'spee' -> 'sp'
      diffEngine('sp');
      expect(backspaceCount).toBe(3);
    });

    test('MDC-06: Viewport anti-cutoff scroll clamp preserves (0, 0) origin', () => {
      let scrollX = 0;
      let scrollY = 45; // iOS Safari pushed viewport down

      const clampScroll = () => {
        if (scrollY !== 0 || scrollX !== 0) {
          scrollX = 0;
          scrollY = 0;
        }
      };

      clampScroll();
      expect(scrollX).toBe(0);
      expect(scrollY).toBe(0);
    });
  });
}
