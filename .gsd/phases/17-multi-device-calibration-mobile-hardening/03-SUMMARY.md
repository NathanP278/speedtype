# Phase 17 Plan 3 Summary: Intentional Mobile UI Overhaul & Spatial Aesthetics

## Deliverables
- **src/components/TerminalViewport.tsx**:
  - Eliminated mobile badge clutter: concealed the wide horizontal desktop badge strip (`DeviceBadge`, avatar pill, calibration badge) on `sm:hidden`.
  - On phones, header presents only clean brand `⚡ SPEEDTYPE` and `[MODES ☰]`.
  - Palette button concealed on phone headers (`hidden sm:inline-flex`).
- **src/components/ModernDuelArena.tsx**:
  - High-contrast Hero word typography: Untyped letters styled with crisp `text-zinc-400 font-bold` (eliminating near-invisible `text-zinc-700` black-on-black).
  - Replaced clumsy button-like upcoming word cards with an elegant flowing text ribbon (`render · player · beacon`).
  - Replaced 120px desktop card on phones with a sleek 32px mobile combat bar (`YOU 60 WPM • RIVAL 63 WPM [↺] [⚡]`).
- **src/components/VirtualKeyboardDock.tsx**:
  - Suppressed floating circular `⌨` toggle button on mobile devices and while keyboard is active, preventing footer clipping and overlap.

## Verification
- `npm run build`: Code 0, clean build.
- `npx tsx test/run-all-tests.ts`: All 193 test assertions pass.
- Git commit: `aa7ab71` pushed to `origin/master`.
