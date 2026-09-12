---
phase: 15
plan: 3
wave: 3
depends_on:
  - 15.1
  - 15.2
files_modified:
  - index.html
  - src/components/TerminalViewport.tsx
  - src/components/ModernDuelArena.tsx
  - src/components/TypingTest.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Arena and combat elements dynamically adapt to mobile virtual keyboard height shifts via window.visualViewport, keeping the target word centered."
    - "Hero word typography scales responsively from text-4xl on mobile screens up to text-8xl on desktop displays without clipping or text wrapping."
    - "TerminalViewport header and footer gracefully collapse secondary controls on small screens while preserving touch-friendly targets (min 44px)."
    - "Viewport meta tag includes viewport-fit=cover and safe-area insets prevent notch/home indicator clipping on modern smartphones."
  artifacts:
    - "index.html"
    - "src/components/TerminalViewport.tsx"
    - "src/components/ModernDuelArena.tsx"
    - "src/components/TypingTest.tsx"
---

# Plan 15.3: VisualViewport Dynamics, Safe Areas & Fluid Responsive Arena Layout

<objective>
Overhaul viewport geometry, safe-area padding, and typography to achieve fluid responsive adaptation across all screen sizes (phones, tablets, desktop monitors) and handle mobile virtual keyboard popping up using the `window.visualViewport` API.

Purpose: Prevent clipping, overflowing words, broken fixed-height layouts, and obscured input areas when mobile software keyboards open.
Output: Responsive meta tags, dynamic visualViewport CSS variables in TerminalViewport, responsive ModernDuelArena layout, and touch-adapted TypingTest calibration.
</objective>

<context>
Load for context:
- index.html
- src/components/TerminalViewport.tsx
- src/components/ModernDuelArena.tsx
- src/components/TypingTest.tsx
</context>

<tasks>

<task type="auto">
  <name>Configure Safe Areas & Mobile Web App Meta in index.html</name>
  <files>index.html</files>
  <action>
    Update `index.html`:
    - Set viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`.
    - Add mobile web app meta tags:
      `<meta name="mobile-web-app-capable" content="yes" />`
      `<meta name="apple-mobile-web-app-capable" content="yes" />`
      `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
    - Update `body` styles to include dynamic viewport height: `min-h-[100dvh] h-[100dvh] touch-manipulation`.
  </action>
  <verify>npm run build</verify>
  <done>index.html properly configured for full-bleed mobile display with safe-area support.</done>
</task>

<task type="auto">
  <name>Implement VisualViewport Height Synchronization & Keyboard-Active Viewport in TerminalViewport</name>
  <files>src/components/TerminalViewport.tsx</files>
  <action>
    Update `src/components/TerminalViewport.tsx`:
    - Listen to `window.visualViewport` 'resize' and 'scroll' events.
    - Track `keyboardHeight = Math.max(0, window.innerHeight - visualViewport.height)` and boolean `isKeyboardOpen = keyboardHeight > 120`.
    - Set CSS custom properties:
      `--visual-viewport-height: ${visualViewport.height}px`
      `--keyboard-height: ${keyboardHeight}px`
    - Bind viewport container height to `var(--visual-viewport-height, 100dvh)` with `overflow-hidden` to strictly lock out iOS Safari rubber-band scrolling.
    - When `isKeyboardOpen` is true on mobile:
      - Auto-collapse header into an ultra-compact 36px minimal strip (hide secondary badges).
      - Auto-hide the 32px footer completely so 100% of remaining screen real estate is reserved for the combat arena.
    - Mount `DeviceBadge` into header next to player profile.
    - Add safe-area padding: `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]`.
  </action>
  <verify>npm run build</verify>
  <done>TerminalViewport dynamically resizes to exact visual viewport and collapses chrome when keyboard opens.</done>
</task>

<task type="auto">
  <name>Implement Anti-Occlusion Keyboard-Active Arena & Responsive Typography</name>
  <files>src/components/ModernDuelArena.tsx, src/components/TypingTest.tsx</files>
  <action>
    Update `src/components/ModernDuelArena.tsx` and `src/components/TypingTest.tsx`:
    - In `ModernDuelArena.tsx`:
      - Detect keyboard-active state via visualViewport hook or CSS media/classes.
      - When keyboard is open:
        - Compress Race Strip into an ultra-slim 3px progress bar directly at the top.
        - Anchor Hero Word zone in the vertical center of the visible area above the keyboard.
        - Responsive typography: scale word text from `text-3xl sm:text-5xl md:text-7xl lg:text-8xl` with `break-keep` to eliminate line wrapping.
        - Render an anchored Typing Focus Bar directly above the virtual keyboard showing:
          Current typed progress, cursor glow, and upcoming 2 words in a compact HUD pill so the player NEVER loses visual contact with their target.
        - Ambient bar: hidden or collapsed into an ultra-compact single badge while keyboard is active.
    - In `TypingTest.tsx`:
      - When keyboard opens, collapse the 4-column metric ribbon into an ultra-slim top status strip (Timer | Net WPM).
      - Center the active passage line squarely in the visible viewport so the lines being typed are 100% visible above the keyboard.
      - Replace hidden -9999px input with viewport-anchored `AdaptiveInputCapture` so mobile virtual keyboard activates properly on touch without page jumping.
  </action>
  <verify>npm run build</verify>
  <done>ModernDuelArena and TypingTest guarantee 100% visibility of active words when virtual keyboard pops up.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` compiles with zero TypeScript errors.
- [ ] Hero word does not overflow horizontal viewport on 375px mobile width.
- [ ] TerminalViewport adapts container height to `visualViewport.height` during mobile keyboard expansion.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
