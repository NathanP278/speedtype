# Phase 17 Plan 4 Summary: Mobile Viewport Anti-Cutoff & Verification Suite

## Deliverables
- **src/engine/useDeviceProfile.ts**:
  - Implemented anti-cutoff viewport lock: Automatically clamps `window.scrollTo(0, 0)` and resets `scrollTop = 0` on `visualViewport` resize and scroll events, strictly preventing iOS Safari from scrolling the header and race track off-screen upon keyboard activation.
  - Published `--visual-viewport-offset-top` CSS variable.
- **test/multiDeviceCalibration.test.ts**:
  - Authored automated test suite validating:
    - `MDC-01`: Independent per-device calibration persistence across categories ('mobile', 'tablet', 'desktop').
    - `MDC-02`: Anti-mismatch detection gate when switching hardware without calibration.
    - `MDC-03`: Benchmark restoration when returning to previously calibrated hardware.
    - `MDC-04`: Controlled buffer diffing for rapid bursts and single characters.
    - `MDC-05`: Controlled buffer diffing for multi-character deletion and backspacing.
    - `MDC-06`: Viewport anti-cutoff scroll clamp preserving (0, 0) origin.
- **test/run-all-tests.ts**:
  - Registered and executed all 6 Phase 17 assertions.

## Verification
- `npm run build`: Code 0, clean build.
- `npx tsx test/run-all-tests.ts`: All 199 test assertions pass cleanly with zero regressions.
- Git commit: `99e2340` pushed to `origin/master`.
