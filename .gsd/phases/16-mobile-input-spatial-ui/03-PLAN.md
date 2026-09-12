---
phase: 16
plan: 3
wave: 3
depends_on:
  - 16.1
  - 16.2
files_modified:
  - src/components/TypingTest.tsx
  - test/mobileInputEngine.test.ts
  - test/run-all-tests.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "TypingTest calibration view is responsive, spacious, and readable when mobile virtual keyboard is active."
    - "Automated unit test suite verifies zero dropped keystrokes during simulated rapid-fire typing bursts (<15ms interval)."
    - "Automated unit test suite verifies mobile beforeinput event sequences (insertText, deleteContentBackward) and deduplication."
    - "All 187+ test assertions pass cleanly with zero regressions."
  artifacts:
    - "src/components/TypingTest.tsx"
    - "test/mobileInputEngine.test.ts"
    - "test/run-all-tests.ts"
---

# Plan 16.3: Calibration Polish & Automated Input Validation Suite

<objective>
Apply responsive layout elegance to the TypingTest calibration benchmark and construct an automated test suite verifying the zero-latency, zero-dropped-keystroke mobile input engine.

Purpose: Complete cross-device polish and prove empirically that rapid typing bursts, consecutive double-letters, and mobile event streams are captured flawlessly.
Output: Responsive TypingTest component, new automated mobile input test suite, and integrated test runner.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/components/TypingTest.tsx
- test/run-all-tests.ts
</context>

<tasks>

<task type="auto">
  <name>Polish TypingTest Calibration Spacing on Mobile</name>
  <files>src/components/TypingTest.tsx</files>
  <action>
    Update `TypingTest.tsx`:
    - When `isKeyboardActive` is true:
      - Clean, streamlined metric display: Show only remaining Timer and current Net WPM in a sleek top row, eliminating unnecessary multi-card clutter.
      - Target passage container: Provide generous internal padding (`p-4 sm:p-6`), readable line-height, and fluid font size (`text-base sm:text-xl`). Ensure the current typing line stays centered or comfortably visible.
      - Hide non-essential secondary instruction text during active keyboard typing.
  </action>
  <verify>
    Run `npm run build` to verify type safety and layout integrity.
  </verify>
  <done>
    TypingTest renders cleanly and comfortably on mobile without cramped borders or awkward scrolling.
  </done>
</task>

<task type="auto">
  <name>Construct Automated Mobile Input Engine Verification Suite</name>
  <files>test/mobileInputEngine.test.ts, test/run-all-tests.ts</files>
  <action>
    1. Create `test/mobileInputEngine.test.ts`:
       - Test rapid consecutive keystrokes: Verify that consecutive keystrokes dispatched within 5-10ms (e.g. typing 'speed' with rapid 'ee') register 100% of characters without dropping.
       - Test mobile `beforeinput` event handling: Verify `insertText` dispatches characters to callback and prevents default DOM mutation.
       - Test `deleteContentBackward` backspace handling: Verify backspace triggers backspace callback and prevents default.
       - Test single-tick deduplication: Verify that when both keydown and beforeinput fire in the same tick for backspace, only a single backspace is recorded.
       - Test non-printable key filtering: Verify modifier keys (Ctrl, Alt, Meta) and navigation keys are handled correctly.
    2. Register the suite in `test/run-all-tests.ts`.
  </action>
  <verify>
    Execute `npx tsx test/run-all-tests.ts` and verify all test suites pass with code 0.
  </verify>
  <done>
    Mobile input engine is rigorously verified with automated assertions passing alongside all existing suites.
  </done>
</task>

</tasks>
