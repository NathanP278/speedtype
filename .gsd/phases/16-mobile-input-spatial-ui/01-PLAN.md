---
phase: 16
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/components/AdaptiveInputCapture.tsx
  - src/engine/useSimpleDuel.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Typing on mobile virtual keyboards (iOS Safari QuickType, Android Gboard, iPadOS) exhibits zero input lag and zero dropped characters."
    - "Rapid typing and consecutive identical characters (e.g., 'ee', 'll') within <30ms register with 100% accuracy without artificial throttling."
    - "Text insertion via beforeinput is canceled before DOM mutation, eliminating cursor resetting and software keyboard dictionary stutter."
    - "Single-tick microtask deduplication prevents duplicate processing across keydown, beforeinput, and onChange without arbitrary millisecond windows."
  artifacts:
    - "src/components/AdaptiveInputCapture.tsx"
---

# Plan 16.1: Zero-Latency Mobile Input Engine & Virtual Keyboard Pipeline

<objective>
Re-architect AdaptiveInputCapture into a zero-latency, deterministic mobile input capture engine that completely eliminates input lag, dropped letters, and keyboard stutter across iOS QuickType, iPadOS, and Android Gboard.

Purpose: Fix the user's primary mobile complaint where typing lags heavily and pressing letters frequently fails to register due to race conditions and a flawed 30ms debounce window.
Output: Hardened AdaptiveInputCapture component with cancelable beforeinput intake, microtask-scoped event deduplication, and zero-flicker cursor anchoring.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/components/AdaptiveInputCapture.tsx
- src/engine/useSimpleDuel.ts
</context>

<tasks>

<task type="auto">
  <name>Re-architect AdaptiveInputCapture Event Pipeline</name>
  <files>src/components/AdaptiveInputCapture.tsx</files>
  <action>
    Refactor `AdaptiveInputCapture.tsx`:
    1. Eliminate the arbitrary `Date.now() - lastKeyHandledRef.current < 30` throttle. Replace it with `microtask`-scoped event deduplication (`beforeInputHandledInTickRef` and `backspaceHandledInTickRef`) that resets synchronously at the end of the current JavaScript event loop tick via `queueMicrotask()`.
    2. Primary Character Intake via `beforeinput`:
       - Intercept `insertText`, `insertCompositionText`, and `insertFromPaste`.
       - Call `e.preventDefault()` immediately to prevent the character from entering the native input DOM node.
       - Disallow synchronous `input.value = ''` clearing during text insertion, completely eradicating iOS Safari keyboard dictionary resets, cursor jumps, and IPC latency.
       - Forward each character in `e.data` immediately to `onCharInput(ch)`.
    3. Deterministic Backspace Handling:
       - In `handleKeyDown`: Handle `e.key === 'Backspace'`. If handled, call `e.preventDefault()`, trigger `onBackspace()`, set `backspaceHandledInTickRef.current = true`, and schedule reset via `queueMicrotask`.
       - In `handleBeforeInput`: If `e.inputType === 'deleteContentBackward'`, call `e.preventDefault()`. If `backspaceHandledInTickRef.current` is true (already handled by physical keydown in same tick), ignore. Otherwise, trigger `onBackspace()`.
    4. Fallback `onChange`:
       - If a legacy browser does not support canceling `beforeinput` and inserts text into `input.value`:
       - Check `beforeInputHandledInTickRef.current`. If true, silently reset `input.value = ''` and return.
       - Otherwise, extract new characters, forward to `onCharInput`, and reset `input.value = ''`.
    5. Mobile Input Geometry & Security Anchoring:
       - Update input element positioning to `position: fixed; bottom: 0; left: 50%; width: 1px; height: 1px; opacity: 0.001; pointerEvents: none;` with `fontSize: '16px'` to strictly prevent iOS Safari viewport auto-zooming and scroll jumping.
       - Add `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="off"`, `spellCheck={false}`, `enterKeyHint="go"`, `data-form-type="other"`, `data-1p-ignore="true"`, `data-lpignore="true"`.
    AVOID: Arbitrary millisecond-based time windows (`Date.now() - last < X`). Human rapid tapping and software keyboard event batches can arrive in <15ms; millisecond throttling causes dropped characters.
  </action>
  <verify>
    Inspect file structure, verify clean TypeScript types, and test rapid consecutive key dispatches in test runner.
  </verify>
  <done>
    AdaptiveInputCapture processes beforeinput without DOM value resetting, handles Backspace deterministically, and never drops rapid consecutive keystrokes.
  </done>
</task>

<task type="auto">
  <name>Synchronize Combat Engine with Adaptive Input Stream</name>
  <files>src/engine/useSimpleDuel.ts</files>
  <action>
    Review `useSimpleDuel.ts` input handlers:
    - Verify `processCharInput` processes incoming characters sequentially without dropping rapid bursts.
    - Ensure window-level `keydown` listener strictly ignores events when target is an `HTMLInputElement`, delegating 100% of focused input stream to `AdaptiveInputCapture`.
    - Ensure start-on-first-keystroke timer initializes smoothly on the first `processCharInput` call from `AdaptiveInputCapture`.
  </action>
  <verify>
    Run `npm run build` to ensure zero compilation or type errors.
  </verify>
  <done>
    `useSimpleDuel.ts` handles rapid input stream from `AdaptiveInputCapture` with zero dropped keystrokes.
  </done>
</task>

</tasks>
