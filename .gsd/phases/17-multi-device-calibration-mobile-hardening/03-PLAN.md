---
phase: 17
plan: 3
wave: 2
depends_on:
  - 17.1
files_modified:
  - src/components/TerminalViewport.tsx
  - src/components/ModernDuelArena.tsx
  - src/components/VirtualKeyboardDock.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Mobile UI looks completely intentional, native, and uncluttered, rather than a cramped desktop site shrunken down."
    - "Header on mobile hides horizontal badge pileup (DeviceBadge, avatar button, calibration badge moved to menu modal), showing only clean brand and menu icon."
    - "Hero Word is large, prominent, and high-contrast, with readable untyped characters (zinc-400 instead of near-invisible zinc-700)."
    - "Upcoming words are rendered as a flowing text preview (render · player · beacon) rather than clumsy button-like cards."
    - "Giant 120px desktop stats card at the bottom is replaced on mobile with an ultra-sleek, compact combat pulse bar."
    - "Floating virtual keyboard dock toggle button that overlaps the footer on mobile is completely eradicated."
  artifacts:
    - "src/components/TerminalViewport.tsx"
    - "src/components/ModernDuelArena.tsx"
    - "src/components/VirtualKeyboardDock.tsx"
---

# Plan 17.3: Intentional Mobile UI Overhaul & Spatial Aesthetics

<objective>
Execute a complete visual and spatial redesign of the mobile user interface to make it look intentional, modern, and spacious. Eradicate header badge crowding, replace button-like upcoming word cards with a flowing ribbon, make untyped characters high-contrast and readable, and replace the giant bottom stats card with a sleek combat pulse HUD.

Purpose: Directly address the user's feedback and uploaded screenshots: "please fix the UI for mobile devices cause I promise it looks so bad. It looks so cramped together... UI doesn't look intentional for mobile".
Output: Redesigned TerminalViewport header, high-contrast ModernDuelArena, flowing word ribbon, and sleek mobile combat bar.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/components/TerminalViewport.tsx
- src/components/ModernDuelArena.tsx
- src/components/VirtualKeyboardDock.tsx
</context>

<tasks>

<task type="auto">
  <name>Redesign TerminalViewport Header for Mobile Intent</name>
  <files>src/components/TerminalViewport.tsx</files>
  <action>
    Refactor `TerminalViewport.tsx` header layout:
    1. Eradicate Mobile Badge Crowding:
       - On mobile (`sm:hidden`), hide the desktop badge strip: `DeviceBadge`, the wide Google Avatar username pill, and the `⚡ Benchmark 60 WPM` pill.
       - Showing 4 horizontal pills on a 390px iPhone causes them to collide, overlap, and truncate.
       - Keep mobile header clean and balanced:
         - Left: `⚡ SPEEDTYPE`
         - Right: `[MODES ☰]` button
       - Move account details, device telemetry, and calibration status into the clean `MenuModal` where mobile users can access them comfortably.
    2. Desktop & Tablet:
       - Keep the full badge strip on `hidden sm:flex` for desktop/tablet viewports where space is plentiful.
    AVOID: Forcing desktop pill badges into narrow mobile viewports.
  </action>
  <verify>
    Run `npm run build` to verify clean compilation and layout.
  </verify>
  <done>
    Mobile header is clean, sleek, and free of cramped badges on phone screens.
  </done>
</task>

<task type="auto">
  <name>Overhaul ModernDuelArena for Mobile Ergonomics & High Contrast</name>
  <files>src/components/ModernDuelArena.tsx, src/components/VirtualKeyboardDock.tsx</files>
  <action>
    Refactor `ModernDuelArena.tsx`:
    1. Hero Word High-Contrast Typography:
       - Fix the low-contrast issue where untyped letters were `text-zinc-700` (nearly invisible black-on-black).
       - Style untyped letters in crisp, readable `text-zinc-400` with subtle opacity so the pilot can easily read upcoming letters in all lighting conditions.
       - Current letter receives a vibrant theme caret pulse; typed letters glow with phosphor radiance.
       - Enlarge typography on mobile: `text-5xl xs:text-6xl sm:text-7xl` with generous letter-spacing (`tracking-wider`).
    2. Eliminate Clumsy Upcoming Word Cards:
       - Replace the 4 separate button-like pill boxes (`[screen] [render] [player] [beacon]`) with an elegant, flowing typography ribbon:
         `render  ·  player  ·  beacon`
         with soft zinc-500 typography and zero bulky borders.
    3. Sleek Mobile Combat Pulse Bar:
       - Replace the heavy 120px desktop card (`YOU: 60 WPM • ACC: 100% • STREAK: 0`, `RIVAL: RIVAL // EVEN MATCH`, `[Restart] [Recalibrate]`) with a streamlined mobile combat bar on phones:
         - A slim, elegant 32px pill: `YOU 60 WPM  •  RIVAL 63 WPM` with quick `[↺]` restart icon.
         - On desktop/tablet (`hidden sm:flex`), retain the extended ambient stats bar.
    4. Clean Floating Dock Trigger:
       - In `VirtualKeyboardDock.tsx`, hide the circular `⌨` button completely on mobile touch devices when native typing is active, preventing it from clipping or overlapping the footer.
  </action>
  <verify>
    Run `npm run build` to ensure zero compilation or styling errors.
  </verify>
  <done>
    ModernDuelArena provides a focused, high-contrast, uncluttered combat interface built specifically for mobile screens.
  </done>
</task>

</tasks>
