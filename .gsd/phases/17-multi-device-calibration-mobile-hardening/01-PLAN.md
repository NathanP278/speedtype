---
phase: 17
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/engine/calibration.ts
  - src/App.tsx
  - src/components/TypingTest.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "User calibration records now persist the device category ('mobile' | 'tablet' | 'desktop'), OS, and hardware form factor."
    - "App automatically probes the current device on startup and compares it against the saved calibration device."
    - "If a device mismatch is detected (e.g. calibrated on Desktop but opening on Mobile, or vice-versa), the user is gated to take a fresh device-specific calibration benchmark."
    - "TypingTest calibration view displays a prominent cyberpunk Device Mismatch banner explaining why recalibration is required to balance Rival AI."
    - "Calibrations are preserved per device category so returning to a previously calibrated device restores its tuned benchmark."
  artifacts:
    - "src/engine/calibration.ts"
    - "src/App.tsx"
    - "src/components/TypingTest.tsx"
---

# Plan 17.1: Multi-Device Calibration Storage, Anti-Mismatch Gate & Device Profile Mapping

<objective>
Implement per-device calibration storage and an automatic anti-mismatch detection gate. When a player switches between devices (e.g., calibrates on a 110 WPM desktop keyboard, then switches to a 45 WPM phone virtual keyboard), the system detects the device transition and requires a fresh calibration to keep Rival AI balanced.

Purpose: Solve the user requirement: "every time they access the website... you have to check what device you're using and if it's different from the saved last that they use you're going to make them redo the calibration test".
Output: Enhanced calibration engine with device metadata, multi-device persistence map, device mismatch detector, and updated App gate.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/engine/calibration.ts
- src/engine/deviceDetector.ts
- src/engine/useDeviceProfile.ts
- src/App.tsx
- src/components/TypingTest.tsx
</context>

<tasks>

<task type="auto">
  <name>Extend Calibration Engine with Multi-Device Storage & Mismatch Detection</name>
  <files>src/engine/calibration.ts</files>
  <action>
    Update `src/engine/calibration.ts`:
    1. Extend `UserCalibration` interface:
       ```ts
       deviceCategory?: 'mobile' | 'tablet' | 'desktop';
       deviceFormFactor?: string;
       deviceOs?: string;
       ```
    2. Implement multi-device storage map in localStorage (`speedtype_calibrations_map`):
       - Keys: `'mobile' | 'tablet' | 'desktop'`
       - Value: `UserCalibration`
       - Preserve backward compatibility with legacy `speedtype_user_calibration`.
    3. Store last calibrated device info:
       - `speedtype_last_calibrated_category`: DeviceCategory
       - `speedtype_last_calibrated_form_factor`: string
    4. Implement `getDeviceCalibration(category: DeviceCategory): UserCalibration | null`
    5. Implement `saveCalibration(calibration: UserCalibration, deviceProfile?: DeviceProfile): void`
    6. Implement `checkDeviceCalibrationMismatch(currentCategory: DeviceCategory, currentFormFactor: string): { hasMismatch: boolean; requiresCalibration: boolean; previousDevice?: string; currentDevice?: string }`:
       - If no calibration exists for `currentCategory`, `requiresCalibration = true`.
       - If last used device was different from `currentCategory` and `currentCategory` has no calibration, `hasMismatch = true`.
    AVOID: Breaking existing calibrations without migration fallbacks.
  </action>
  <verify>
    Run `npm run build` to verify clean type definitions and exports.
  </verify>
  <done>
    `calibration.ts` supports per-device calibration maps and mismatch detection logic.
  </done>
</task>

<task type="auto">
  <name>Integrate Device Mismatch Gate into App & Calibration Banner</name>
  <files>src/App.tsx, src/components/TypingTest.tsx</files>
  <action>
    1. In `src/App.tsx`:
       - Use `useDeviceProfile()` to get the current hardware profile (`device.profile.category`, `device.profile.formFactor`).
       - On mount and device profile evaluation, check `checkDeviceCalibrationMismatch`:
         - If the current device category lacks a calibration, or if a switch from another device occurred without a calibration on this device, activate `isCalibrating = true`.
         - Set active calibration to `getDeviceCalibration(device.profile.category)`.
       - When calibration completes in `handleCalibrationComplete`, pass `device.profile` to `saveCalibration`.
    2. In `src/components/TypingTest.tsx`:
       - Accept optional `mismatchInfo?: { previousDevice?: string; currentDevice?: string }`.
       - When mismatch info is present, render a sleek alert banner above the benchmark header:
         `⚡ DEVICE MISMATCH DETECTED: [currentDevice]`
         `Last calibrated on [previousDevice]. Calibrate on this hardware to ensure accurate Rival AI balance.`
  </action>
  <verify>
    Run `npm run build` to ensure zero compilation or styling errors.
  </verify>
  <done>
    App enforces device-specific calibration gates with clear visual feedback when switching devices.
  </done>
</task>

</tasks>
