---
phase: 17
plan: 3
wave: 3
depends_on:
  - 17.1
  - 17.2
files_modified:
  - src/engine/useDeviceProfile.ts
  - src/components/ModernDuelArena.tsx
  - src/components/TypingTest.tsx
  - test/multiDeviceCalibration.test.ts
  - test/run-all-tests.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "iOS Safari window scroll is automatically locked and clamped to (0, 0) during virtual keyboard activation, preventing the header and race strip from being pushed off-screen."
    - "Arena and calibration layout dynamically scale within compact viewports (<450px visual height), ensuring hero word, race track, and input are never visually cut off."
    - "Automated unit test suite verifies multi-device calibration storage, device switching mismatch detection, and controlled buffer diffing."
    - "All 193+ test assertions pass cleanly with zero regressions."
  artifacts:
    - "src/engine/useDeviceProfile.ts"
    - "test/multiDeviceCalibration.test.ts"
    - "test/run-all-tests.ts"
---

# Plan 17.3: Mobile Viewport Anti-Cutoff Geometry, Safe-Area Anchoring & Automated Verification

<objective>
Eliminate mobile viewport clipping and scrolling cutoffs by locking window scroll coordinates to (0, 0) on visualViewport changes, implement dynamic scaling for ultra-short mobile viewports, and verify all device calibration and input hardening features with automated tests.

Purpose: Fix the visual cutoff where iOS Safari scrolls the top of the app off-screen when the keyboard appears, and provide automated proof of device switching logic.
Output: Hardened useDeviceProfile hook with anti-cutoff scroll locking, responsive viewport scaling, and comprehensive automated test suite.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/engine/useDeviceProfile.ts
- src/components/ModernDuelArena.tsx
- src/components/TypingTest.tsx
- test/run-all-tests.ts
</context>

<tasks>

<task type="auto">
  <name>Implement iOS Safari Anti-Cutoff Scroll Lock & Dynamic Viewport Height</name>
  <files>src/engine/useDeviceProfile.ts, src/components/ModernDuelArena.tsx</files>
  <action>
    1. In `src/engine/useDeviceProfile.ts`:
       - In `handleVvChange` (listening to `visualViewport` resize and scroll):
         - On iOS Safari, opening the keyboard triggers an automatic page scroll (`window.scrollY > 0`), which pushes the header and top race track off-screen with no way to scroll back.
         - Enforce: `if (typeof window !== 'undefined' && window.scrollY !== 0) { window.scrollTo(0, 0); }`
         - Lock `document.body.scrollTop = 0` and `document.documentElement.scrollTop = 0`.
         - Set CSS variable `--visual-viewport-offset-top` to `vv.offsetTop`.
    2. In `src/components/ModernDuelArena.tsx`:
       - Handle short viewports (visual viewport height < 450px):
         - Ensure race track, hero word, and upcoming words scale proportionally without vertical overflow.
         - Set `min-h-0` and responsive margins so the entire battle UI stays 100% visible between the header and keyboard.
  </action>
  <verify>
    Run `npm run build` to verify type safety and layout integrity.
  </verify>
  <done>
    Viewport never scrolls off-screen on keyboard pop-up, and arena elements remain fully visible without clipping.
  </done>
</task>

<task type="auto">
  <name>Build Automated Multi-Device Calibration & Input Hardening Test Suite</name>
  <files>test/multiDeviceCalibration.test.ts, test/run-all-tests.ts</files>
  <action>
    1. Create `test/multiDeviceCalibration.test.ts`:
       - Test per-device calibration persistence: verify mobile, tablet, and desktop calibrations save and load independently.
       - Test device mismatch detection: verify that switching from desktop to mobile flags `hasMismatch = true` and requires calibration.
       - Test returning to previously calibrated device: verify switching back restores tuned benchmark.
       - Test controlled buffer diffing: verify typed character extraction, multi-character word insertion, and backspace handling.
       - Test anti-cutoff window scroll clamp logic.
    2. Register the suite in `test/run-all-tests.ts`.
  </action>
  <verify>
    Execute `npx tsx test/run-all-tests.ts` and verify all tests pass with code 0.
  </verify>
  <done>
    Automated verification suite tests all Phase 17 device and input requirements with zero regressions.
  </done>
</task>

</tasks>
