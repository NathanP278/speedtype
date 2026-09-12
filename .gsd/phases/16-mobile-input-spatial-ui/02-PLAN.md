---
phase: 16
plan: 2
wave: 2
depends_on:
  - 16.1
files_modified:
  - src/components/ModernDuelArena.tsx
  - src/components/TerminalViewport.tsx
  - src/components/VirtualKeyboardDock.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Mobile and tablet arena layout is visually spacious and elegant, eliminating the cramped, squished feeling when the virtual keyboard is active."
    - "Redundant duplicate typing focus bar ('ACTIVE: ...') is eradicated; the Hero Word serves as the sole majestic typing focus."
    - "Top race progress is rendered as an ultra-clean, minimalist kinetic track without bulky card borders."
    - "TerminalViewport header collapses clutter when keyboard is active, keeping only essential title and menu toggle."
    - "Cybernetic VirtualKeyboardDock floating toggle button is automatically suppressed when the native software keyboard is already open."
  artifacts:
    - "src/components/ModernDuelArena.tsx"
    - "src/components/TerminalViewport.tsx"
    - "src/components/VirtualKeyboardDock.tsx"
---

# Plan 16.2: Spatial Elegance & Uncluttered Fluid Mobile Layout

<objective>
Transform the mobile, tablet, and cross-device typing UI into an open, spacious, and visually refined cyberpunk combat arena. Eliminate redundant clutter, provide generous negative space for the hero word, and streamline navigation when virtual keyboards are deployed.

Purpose: Address the user's feedback that the mobile UI feels 'freaking compact... all pushed together... not visually appealing at all'.
Output: Redesigned ModernDuelArena, uncluttered TerminalViewport header, and auto-hiding VirtualKeyboardDock trigger.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/components/ModernDuelArena.tsx
- src/components/TerminalViewport.tsx
- src/components/VirtualKeyboardDock.tsx
</context>

<tasks>

<task type="auto">
  <name>Redesign ModernDuelArena for Spatial Elegance</name>
  <files>src/components/ModernDuelArena.tsx</files>
  <action>
    Refactor `ModernDuelArena.tsx` layout and responsive structure:
    1. Eradicate Redundant Mobile Typing Bar:
       - Completely remove the 'Section 2.5: Anchored Mobile Typing Focus Bar' (`ACTIVE: [word] NEXT: [word]`). The hero word already features animated glowing characters, cursor pulse, and upcoming word previews. Duplicating this widget squishes the layout and wastes vertical space.
    2. Streamline Race Progress Bar:
       - On mobile and when virtual keyboard is active (`isKeyboardActive`), render an ultra-sleek, low-profile progress track without heavy outer padding or redundant text borders.
       - Player and rival indicators stay crisp, minimal, and unobtrusive.
    3. Majestic Hero Word Framing:
       - Replace the claustrophobic `min-h-[110px] max-h-[160px]` height clamp with a fluid flex layout (`flex-1 flex flex-col justify-center items-center py-4 sm:py-8`).
       - Set fluid hero word typography (`text-4xl sm:text-6xl md:text-7xl lg:text-8xl`) with generous horizontal letter-spacing (`tracking-widest`) and high-contrast styling.
       - Clean up upcoming words ribbon: render 1-2 subtle, borderless upcoming word previews with low-opacity text beneath the hero word instead of a crowded multi-tag pill grid.
    4. Touch & Focus Handling:
       - Keep arena container touchable so tapping anywhere on screen instantly focuses the input capture receiver.
    AVOID: Cramming stats, badges, active word replicas, and heavy borders into the visual viewport above the mobile keyboard.
  </action>
  <verify>
    Run `npm run build` to verify type safety and layout integrity.
  </verify>
  <done>
    ModernDuelArena renders with generous vertical breathing room, zero redundant widgets, and a prominent hero word on all screen sizes.
  </done>
</task>

<task type="auto">
  <name>Streamline TerminalViewport & Auto-Hide Keyboard Dock</name>
  <files>src/components/TerminalViewport.tsx, src/components/VirtualKeyboardDock.tsx</files>
  <action>
    1. Update `TerminalViewport.tsx`:
       - When `isKeyboardOpen` is true on mobile:
         - Keep header minimal: brand icon + title, active WPM indicator, and menu toggle button (`[MODES]`).
         - Hide DeviceBadge, player avatar popover, and secondary badges during active virtual keyboard typing to prevent header crowding.
       - Ensure `var(--visual-viewport-height, 100dvh)` smoothly binds the entire viewport without scroll jumping.
    2. Update `VirtualKeyboardDock.tsx`:
       - Check `useDeviceProfile().isKeyboardOpen`: When the native virtual keyboard is already active, suppress the floating "TOUCH KEYBOARD" button so it does not obstruct the arena or receive accidental touches.
  </action>
  <verify>
    Run `npm run build` to ensure zero compilation or styling errors.
  </verify>
  <done>
    Header and dock stay clean, lightweight, and completely non-intrusive when typing on mobile.
  </done>
</task>

</tasks>
