---
phase: 15
plan: 2
wave: 2
depends_on:
  - 15.1
files_modified:
  - src/components/AdaptiveInputCapture.tsx
  - src/components/VirtualKeyboardDock.tsx
  - src/engine/useSimpleDuel.ts
  - src/components/ModernDuelArena.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Typing works effortlessly across all platforms including mobile virtual keyboards (iOS Safari, Android Gboard), external physical keyboards (Bluetooth/USB), and cybernetic on-screen keyboard."
    - "Mobile IME composition / keyCode 229 is handled cleanly via input/beforeinput without character duplication or dropped keystrokes."
    - "Tapping the arena on touch devices summons the native mobile virtual keyboard without causing iOS page auto-zoom or abrupt viewport scroll jumps."
  artifacts:
    - "src/components/AdaptiveInputCapture.tsx"
    - "src/components/VirtualKeyboardDock.tsx"
    - "src/engine/useSimpleDuel.ts"
    - "src/components/ModernDuelArena.tsx"
---

# Plan 15.2: Universal Adaptive Input Engine & Virtual Keyboard Architecture

<objective>
Solve the mobile typing barrier by engineering an adaptive input capture system that supports all input methods: native mobile virtual keyboards (iOS QuickType, Android Gboard/Samsung IME), external physical keyboards (Bluetooth / USB / Magic keyboards), and an optional cybernetic on-screen keyboard dock.

Purpose: Enable typing combat gameplay on phones, tablets, and mobile devices where global window.keydown is unavailable without an active input element, while maintaining zero latency for physical external keyboards.
Output: AdaptiveInputCapture component, VirtualKeyboardDock component, and updated duel engine.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/engine/useSimpleDuel.ts
- src/components/ModernDuelArena.tsx
- src/engine/useDeviceProfile.ts
</context>

<tasks>

<task type="auto">
  <name>Build AdaptiveInputCapture Component with Mobile IME Normalization</name>
  <files>src/components/AdaptiveInputCapture.tsx</files>
  <action>
    Create `src/components/AdaptiveInputCapture.tsx`:
    - Accessible input element anchored cleanly within the visible viewport bounds above the software keyboard (using `visualViewport.height` coordinate anchoring, never -9999px) with `fontSize: 16px` to strictly block iOS Safari auto-zoom.
    - Attributes: `type="text"`, `inputMode="text"`, `autoCapitalize="off"`, `autoCorrect="off"`, `spellCheck={false}`, `enterKeyHint="go"`.
    - Event handlers:
      1. `onKeyDown`: Captures physical single-character keys and Backspace directly, preventing duplicate input events when physical keys are pressed.
      2. `onBeforeInput` / `onChange`: Captures text insertion on mobile virtual keyboards (crucial for Android Gboard where keydown fires keyCode 229 with `key: 'Unidentified'`).
      3. Extracts the typed character, invokes `onCharTyped(char)`, and resets the input value to `''` so every stroke is fresh.
    - Expose `focusInput()` ref handle and listen to tap/touch events on the arena to maintain active focus on mobile without triggering unwanted page scrolling.
  </action>
  <verify>npm run build</verify>
  <done>AdaptiveInputCapture seamlessly captures keystrokes from both physical keyboards and mobile virtual keyboards with IME normalization and zero page shift.</done>
</task>

<task type="auto">
  <name>Build Cybernetic VirtualKeyboardDock Component</name>
  <files>src/components/VirtualKeyboardDock.tsx</files>
  <action>
    Create `src/components/VirtualKeyboardDock.tsx`:
    - Cybernetic styled QWERTY on-screen keyboard designed for tablet / mobile touch players who prefer tactical on-screen arcade typing (or when physical keyboard is detached).
    - Keys layout: 3 rows (QWERTYUIOP, ASDFGHJKL, ZXCVBNM) + Backspace + Spacebar.
    - Touch events: `onTouchStart` / `onClick` triggers `onCharTyped(char)` with haptic feedback (`navigator.vibrate?.(10)`) and procedural audio sound effects.
    - Phosphor glow keypress feedback with CSS active scaling and theme color matching.
    - Collapsible / toggleable dock button to show or hide the on-screen keyboard at will.
  </action>
  <verify>npm run build</verify>
  <done>VirtualKeyboardDock provides a fully functional, tactile on-screen keyboard option.</done>
</task>

<task type="auto">
  <name>Integrate Adaptive Input into useSimpleDuel & ModernDuelArena</name>
  <files>src/engine/useSimpleDuel.ts, src/components/ModernDuelArena.tsx</files>
  <action>
    Update `src/engine/useSimpleDuel.ts` and `src/components/ModernDuelArena.tsx`:
    - In `useSimpleDuel.ts`:
      - Extract keypress processing logic into a reusable `handleCharacterInput(char: string)` and `handleBackspace()` callback.
      - Support both direct window keydown (desktop / external keyboard) and synthetic character input from `AdaptiveInputCapture` / `VirtualKeyboardDock`.
      - Ensure streak, accuracy, sound effects, ghost recording, and rival pacing trigger identically regardless of input source.
    - In `ModernDuelArena.tsx`:
      - Mount `AdaptiveInputCapture` attached to the arena container.
      - On touch/click anywhere in the arena, ensure input is focused so native virtual keyboard pops up on mobile devices.
      - Render floating mobile keyboard toggle button on touch-enabled devices to toggle `VirtualKeyboardDock`.
      - Show visual hint for mobile users: "Tap arena to open keyboard" when waiting to start.
  </action>
  <verify>npm run build</verify>
  <done>Arena accepts input from physical keyboards, native virtual keyboards, and on-screen keyboard dock seamlessly.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` compiles with zero TypeScript errors.
- [ ] Keystrokes are registered from physical keydown, mobile input change, and on-screen keyboard dock.
- [ ] Mobile input does not trigger iOS viewport auto-zoom (fontSize 16px confirmed).
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
