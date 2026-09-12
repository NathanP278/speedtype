/**
 * SpeedType Device Detection & Anti-Spoof Probing Test Suite
 *
 * Validates hardware unmasking, iPadOS desktop deception resolution,
 * DevTools emulation anti-spoof detection, and input normalization.
 */

import { describe, test, expect } from './test-harness.ts';
import { detectDeviceProfile } from '../src/engine/deviceDetector.ts';

export function registerDeviceDetectionTests(): void {
  describe('Device Detection & Anti-Spoof Probing Engine', () => {
    test('DD-01: Default Node / Server fallback detects headless environment', () => {
      const profile = detectDeviceProfile();
      expect(profile.category).toBe('desktop');
      expect(profile.confidence).toBeGreaterThanOrEqual(90);
      expect(profile.isSpoofed).toBe(false);
    });

    test('DD-02: iPadOS Safari Desktop UA is unmasked as Tablet via maxTouchPoints', () => {
      const profile = detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
        pointerType: 'coarse',
        hoverSupported: false,
        screenWidth: 834,
        screenHeight: 1194,
        gpuVendor: 'Apple Inc.',
        gpuRenderer: 'Apple M2 GPU',
      });

      expect(profile.category).toBe('tablet');
      expect(profile.os).toBe('ios');
      expect(profile.formFactor).toContain('iPad');
      expect(profile.isTouchDevice).toBe(true);
      expect(profile.isSpoofed).toBe(false);
    });

    test('DD-03: Authentic iPhone with mobile touch points classifies as mobile', () => {
      const profile = detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
        pointerType: 'coarse',
        hoverSupported: false,
        screenWidth: 393,
        screenHeight: 852,
        gpuVendor: 'Apple Inc.',
        gpuRenderer: 'Apple GPU',
      });

      expect(profile.category).toBe('mobile');
      expect(profile.os).toBe('ios');
      expect(profile.formFactor).toBe('Apple iPhone');
      expect(profile.isSpoofed).toBe(false);
    });

    test('DD-04: Android smartphone classification based on UA and resolution', () => {
      const profile = detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        platform: 'Linux armv8l',
        maxTouchPoints: 10,
        pointerType: 'coarse',
        hoverSupported: false,
        screenWidth: 412,
        screenHeight: 915,
        gpuVendor: 'Qualcomm',
        gpuRenderer: 'Adreno (TM) 740',
      });

      expect(profile.category).toBe('mobile');
      expect(profile.os).toBe('android');
      expect(profile.formFactor).toContain('Android');
      expect(profile.isSpoofed).toBe(false);
    });

    test('DD-05: Desktop Windows Workstation with fine mouse pointer', () => {
      const profile = detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        platform: 'Win32',
        maxTouchPoints: 0,
        pointerType: 'fine',
        hoverSupported: true,
        screenWidth: 1920,
        screenHeight: 1080,
        gpuVendor: 'NVIDIA Corporation',
        gpuRenderer: 'NVIDIA GeForce RTX 4080',
      });

      expect(profile.category).toBe('desktop');
      expect(profile.os).toBe('windows');
      expect(profile.isTouchDevice).toBe(false);
      expect(profile.isSpoofed).toBe(false);
    });

    test('DD-06: Anti-Spoof: Claimed iPhone UA with zero touch points & mouse flags discrepancy', () => {
      const profile = detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
        platform: 'iPhone',
        maxTouchPoints: 0, // Spoofing: zero touch points on desktop
        pointerType: 'fine',
        hoverSupported: true,
        screenWidth: 1920,
        screenHeight: 1080,
        gpuVendor: 'NVIDIA Corporation',
        gpuRenderer: 'NVIDIA GeForce RTX 4070 Direct3D11',
      });

      expect(profile.isSpoofed).toBe(true);
      expect(profile.spoofReasons.length).toBeGreaterThan(0);
      expect(profile.confidence).toBeLessThan(90);
    });
  });
}
