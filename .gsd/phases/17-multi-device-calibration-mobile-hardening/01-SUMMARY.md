# Phase 17 Plan 1 Summary: Multi-Device Calibration Storage & Anti-Mismatch Gate

## Deliverables
- **src/engine/calibration.ts**:
  - Added `CalibrationDeviceCategory` ('mobile' | 'tablet' | 'desktop').
  - Extended `UserCalibration` with `deviceCategory`, `deviceFormFactor`, `deviceOs`.
  - Added per-device category storage in `speedtype_device_calibrations_map`.
  - Added last calibrated device tracking in `speedtype_last_calibrated_device`.
  - Added `getDeviceCalibrationsMap()`, `getLastCalibratedDeviceInfo()`, `checkDeviceCalibrationMismatch()`, `normalizeCalibrationCategory()`, and `saveCalibration(cal, deviceProfile)`.
- **src/App.tsx**:
  - Connected `useDeviceProfile()`.
  - Evaluates `checkDeviceCalibrationMismatch` on startup and device profile changes.
  - Automatically gates uncalibrated or mismatched devices to take a benchmark before dueling.
  - Persists device profile metadata when benchmark completes.
- **src/components/TypingTest.tsx**:
  - Added `mismatchInfo` prop.
  - Renders alert banner on mismatch explaining calibration necessity.
  - Automatically passes device category and form factor to `saveCalibration`.

## Verification
- `npm run build`: Clean TypeScript compilation (Code 0).
- `npx tsx test/run-all-tests.ts`: All 193 test assertions pass.
- Git commit: `c616f41` pushed to `origin/master`.
