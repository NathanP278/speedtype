---
phase: 15
plan: 4
wave: 4
depends_on:
  - 15.1
  - 15.2
  - 15.3
files_modified:
  - src/components/MenuModal.tsx
  - src/components/ModernResultModal.tsx
  - src/components/AuthModal.tsx
  - test/deviceDetection.test.ts
  - test/run-all-tests.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "All modal interfaces adapt gracefully to mobile viewports with max-h-[90dvh], fluid scroll, and touch-friendly tap targets (min 44px)."
    - "MenuModal renders as 1-column on mobile screens and 2-column on desktop screens without clipping."
    - "Automated test suite validates device categorization, WebGL anti-spoof checks, and iPadOS detection across mock hardware environments."
  artifacts:
    - "src/components/MenuModal.tsx"
    - "src/components/ModernResultModal.tsx"
    - "src/components/AuthModal.tsx"
    - "test/deviceDetection.test.ts"
    - "test/run-all-tests.ts"
---

# Plan 15.4: Cross-Device Modal Adaptations & Automated Verification Suite

<objective>
Optimize all modal dialogs for touch ergonomics and mobile viewports, and implement an automated verification test suite verifying device detection, anti-spoof logic, and cross-platform input normalization.

Purpose: Guarantee that every modal (Menu, Results, Auth, Onboarding) is 100% usable on phones and tablets with zero layout clipping or unreachable action buttons, backed by comprehensive automated test assertions.
Output: Mobile-hardened modals, unit tests in test/deviceDetection.test.ts, and integrated verification receipt.
</objective>

<context>
Load for context:
- src/components/MenuModal.tsx
- src/components/ModernResultModal.tsx
- src/components/AuthModal.tsx
- test/run-all-tests.ts
- test/test-harness.ts
</context>

<tasks>

<task type="auto">
  <name>Harden MenuModal, ModernResultModal & AuthModal for Mobile Viewports</name>
  <files>src/components/MenuModal.tsx, src/components/ModernResultModal.tsx, src/components/AuthModal.tsx</files>
  <action>
    Update `MenuModal.tsx`, `ModernResultModal.tsx`, and `AuthModal.tsx`:
    - `MenuModal.tsx`:
      - Responsive layout: convert fixed 2-column grid into `grid grid-cols-1 sm:grid-cols-2 gap-3`.
      - Scroll container: ensure `max-h-[85dvh] overflow-y-auto` with smooth scrolling.
      - Touch targets: buttons styled with `min-h-[44px]` for comfortable finger taps.
    - `ModernResultModal.tsx`:
      - Stats cards: stack in 2 cols or 1 col on mobile (`grid-cols-2 sm:grid-cols-4`).
      - Action buttons (Rematch, Retest, Challenge, Leaderboard): responsive wrap/stack with `w-full sm:w-auto` and prominent primary action.
    - `AuthModal.tsx`:
      - Onboarding wizard: scale stages cleanly on mobile portrait, shrink step indicators if width is narrow.
      - Google OAuth button: full width, touch-friendly, centered with clear iconography.
  </action>
  <verify>npm run build</verify>
  <done>All core modals render fluidly without overflow or truncation on mobile screens.</done>
</task>

<task type="auto">
  <name>Create Device Detection & Anti-Spoof Test Suite</name>
  <files>test/deviceDetection.test.ts</files>
  <action>
    Create `test/deviceDetection.test.ts`:
    - Register suite using `test-harness.ts`:
      1. Phone detection: verify iPhone user agent + touch points > 0 + Apple GPU resolves to mobile iOS.
      2. iPadOS anomaly unmasking: verify Mac Intel user agent + maxTouchPoints = 5 resolves to tablet iOS (anti-spoof pass).
      3. Android phone detection: verify Android user agent + Adreno/Mali GPU resolves to mobile Android.
      4. Desktop Windows/Mac detection: verify desktop user agent + maxTouchPoints = 0 + mouse pointer resolves to desktop.
      5. DevTools Anti-Spoof check: verify iPhone user agent + NVIDIA/Direct3D GPU flags `isSpoofed = true` with discrepancy reason.
      6. Input normalization: verify character input handler processes typed characters and handles Backspace correctly.
  </action>
  <verify>npm run build</verify>
  <done>test/deviceDetection.test.ts implements rigorous hardware probing and anti-spoof assertion tests.</done>
</task>

<task type="auto">
  <name>Register Tests in run-all-tests.ts & Verify Full Test Suite</name>
  <files>test/run-all-tests.ts</files>
  <action>
    Update `test/run-all-tests.ts`:
    - Import and register device detection tests.
    - Run build (`npm run build`) and execute test suite via test runner.
    - Confirm zero regressions across all test tiers.
  </action>
  <verify>npm run build</verify>
  <done>All test tiers and device detection suites pass with zero regressions.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` compiles with zero TypeScript errors.
- [ ] Device detection and anti-spoof tests execute and pass cleanly.
- [ ] All modals fit comfortably in 375x667 mobile viewport without overflow.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
