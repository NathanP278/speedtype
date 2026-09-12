---
phase: 17
plan: 2
wave: 2
depends_on:
  - 17.1
files_modified:
  - src/components/AdaptiveInputCapture.tsx
  - src/components/ModernDuelArena.tsx
  - src/components/TypingTest.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Mobile typing input pipeline completely eliminates typing lag, dropped characters, and WebKit software keyboard disconnects."
    - "Input value maintains an active text buffer that matches the typed characters, preventing iOS QuickType predictive daemon desync and IPC timeouts."
    - "Tapping anywhere on the screen maintains or restores virtual keyboard focus seamlessly without dismissal."
    - "Software keyboard Backspace, swipe typing, and autocorrect suggestions register without stutter."
  artifacts:
    - "src/components/AdaptiveInputCapture.tsx"
---

# Plan 17.2: Zero-Lag Controlled Buffer Input Pipeline & Rapid IME Synchronization

<objective>
Refactor AdaptiveInputCapture to employ a controlled buffer input model that harmonizes with iOS QuickType and Android Gboard predictive engines, completely eliminating the lag and keystroke cutoffs reported by the user.

Purpose: Fix the user's issue: "for mobile devices please more make it it better when it comes to it still lags it still cuts off".
Output: Hardened AdaptiveInputCapture component with synchronized buffer diffing, zero WebKit IPC timeouts, and bulletproof touch-to-focus ergonomics.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/components/AdaptiveInputCapture.tsx
- src/components/ModernDuelArena.tsx
- src/components/TypingTest.tsx
</context>

<tasks>

<task type="auto">
  <name>Re-architect AdaptiveInputCapture with Controlled Buffer Diffing</name>
  <files>src/components/AdaptiveInputCapture.tsx</files>
  <action>
    Refactor `AdaptiveInputCapture.tsx`:
    1. The WebKit Lag & Cutoff Root Cause:
       - In iOS Safari, repeatedly preventing default on `beforeinput` causes WebKit's DOM to remain empty while the QuickType keyboard daemon believes characters were committed. This internal desynchronization triggers IPC sync timeouts (lag) and causes iOS to disconnect the text input session after 3-5 keys ("cutting off").
    2. Controlled Value Synchronization:
       - Accept optional `activeWordValue?: string` or maintain a tracked internal buffer synced to current progress.
       - Allow native character insertion via `onInput` / `onChange`:
         - Track `prevValueRef`.
         - When `e.target.value` changes:
           - If new length > prev length: extract added characters, forward to `onCharInput(ch)`.
           - If new length < prev length: forward `onBackspace()`.
           - Update `prevValueRef`.
       - When a word completes or test resets, cleanly reset the buffer.
    3. Seamless Backspace & IME Composition:
       - For physical keyboards and mobile Backspace:
         - Support `onKeyDown` Backspace when buffer is empty to allow inter-word or start-of-word backspacing.
         - Avoid duplicate backspaces via microtask tick guard.
    4. Focus & Touch Ergonomics:
       - Ensure the hidden input has `pointer-events: auto` and sits strategically or allows direct user touch delegation so iOS Safari never dismisses the virtual keyboard mid-word.
       - Use `inputMode="text"`, `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="off"`, `spellCheck={false}`.
    AVOID: Blindly calling `e.preventDefault()` on all mobile character insertions.
  </action>
  <verify>
    Run `npm run build` to verify clean compilation.
  </verify>
  <done>
    `AdaptiveInputCapture` processes input via synchronized buffer diffing with zero lag and zero software keyboard disconnects.
  </done>
</task>

<task type="auto">
  <name>Wire Controlled Buffer into ModernDuelArena and TypingTest</name>
  <files>src/components/ModernDuelArena.tsx, src/components/TypingTest.tsx</files>
  <action>
    1. In `ModernDuelArena.tsx`:
       - Pass the active typed substring (`currentWordText.slice(0, typedIndex)`) as `currentTypedValue` to `AdaptiveInputCapture`.
       - Ensure arena container touch handlers delegate cleanly to `inputCaptureRef.current?.focus()`.
    2. In `TypingTest.tsx`:
       - Pass `inputHistory` as `currentTypedValue` to `AdaptiveInputCapture`.
       - Ensure benchmark box focus stays firmly locked during active typing.
  </action>
  <verify>
    Run `npm run build` to verify type safety and layout integrity.
  </verify>
  <done>
    Both duel arena and typing test feed controlled buffer state into AdaptiveInputCapture.
  </done>
</task>

</tasks>
