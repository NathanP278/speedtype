# Phase 5 Verification Report: UX Simplification & Visual Calm

## Executive Summary
- **Current Position**: Phase 5 (UX Simplification & Visual Calm)
- **Status**: `gaps_found` (1 of 5 plans implemented in code, 0 of 5 closed in GSD state)
- **Phases 1–4**: Fully implemented and passing (16/16 must-haves verified in previous system audit)

---

## Plan-by-Plan Audit Breakdown

### Plan 5.1: Navigation Collapse & App.tsx Extraction
- **Status**: **PARTIAL / UNWIRED (Gaps Found)**
- **Implemented**:
  - `src/engine/useMatchSession.ts` exists (created in commit `f9721ef`).
- **Gaps / Missing**:
  - `src/components/MenuPanel.tsx` **does not exist** (`Test-Path` returned `False`).
  - `src/components/TerminalViewport.tsx` still contains the 7-button header, individual palette buttons, and individual modal triggers. Missing single `[MENU]` button.
  - `src/App.tsx` remains 530 lines (target <=200). `useMatchSession` is **not imported or wired**; match lifecycle and timers remain in `App.tsx`.

---

### Plan 5.2: CombatHud Redesign & KineticBeam Simplification
- **Status**: **CODE COMPLETE / UNRECORDED IN GSD**
- **Implemented**:
  - `src/components/CombatHud.tsx` rewritten into compact 2-row layout with slim HP bars, compact stance pills ("STR", "CTR", "DIS"), and live stats removed (commit `f9721ef`).
  - `src/components/KineticBeamDisplay.tsx` simplified to bar-only display without -100/0/+100 numeric labels (commit `85f6b01`).
- **Gaps / Missing**:
  - `.gsd/phases/5-ux-simplification/02-SUMMARY.md` was never created.
  - `.gsd/STATE.md` still lists Plan 5.2 as unchecked `[ ]`.

---

### Plan 5.3: Visual Calm-Down & Word Zone Redesign
- **Status**: **NOT IMPLEMENTED**
- **Gaps / Missing**:
  - `src/styles/crt.css`: `glitch-active` remains `0.25s infinite` (plan requires `0.6s` x 3 iterations). Scanline timing and bloom uncalmed.
  - `prefers-reduced-motion` media query block is missing from `src/styles/crt.css`.
  - `.word-cursor` border blink animation is missing from `src/styles/crt.css`.
  - CRT and Scanlines remain ON by default in `TerminalViewport.tsx` (`useState(true)` instead of opt-in default `false`).
  - `src/components/KineticBeamDisplay.tsx` line 73 still uses `scale-150 animate-ping` on overclock instead of `animate-pulse`.
  - `src/App.tsx` word zone still renders symmetric 2-column grid (`grid-cols-1 md:grid-cols-2`) instead of the asymmetric hero card (5xl player word + slim opponent strip).

---

### Plan 5.4: Idle Screen Redesign & Visual Hierarchy
- **Status**: **NOT IMPLEMENTED**
- **Gaps / Missing**:
  - `App.tsx` idle state still renders dense documentation paragraph ("Master the Stance Triangle...") and 2 flat buttons.
  - 3-mode card selector (**Quick Match**, **Ghost Duel**, **Weekly Trial**) is missing.
  - `src/styles/palettes.ts` lacks design token hierarchy documentation / comment block.

---

### Plan 5.5: Modern Web Design Layer
- **Status**: **NOT IMPLEMENTED**
- **Gaps / Missing**:
  - `src/styles/modern.css` does not exist (`Test-Path` returned `False`).
  - `JetBrains Mono` font is not loaded in `index.html` or imported in `src/index.css`.
  - `tailwind.config.js` lacks spring/bounce/fade-up keyframes and `linear()` easing utilities.
  - `MenuPanel.tsx` native `popover="manual"` with `@starting-style` is missing.
  - `src/components/KoSignatureStamp.tsx` lacks `view-transition-name` and `document.startViewTransition` wiring.
  - CRT noise texture overlay (`.crt-noise`) is missing from `TerminalViewport.tsx`.

---

## Artifact Verification Matrix

| Path | Exists | Substantive | Wired | Verdict |
|------|:------:|:-----------:|:-----:|:-------:|
| `src/engine/useMatchSession.ts` | ✓ | ✓ | ✗ | UNWIRED |
| `src/components/MenuPanel.tsx` | ✗ | ✗ | ✗ | MISSING |
| `src/components/CombatHud.tsx` | ✓ | ✓ | ✓ | VERIFIED |
| `src/components/KineticBeamDisplay.tsx` | ✓ | ✓ | ✓ | VERIFIED |
| `src/styles/crt.css` (calm updates) | ✓ | ✗ | ✓ | UNMODIFIED |
| `src/styles/palettes.ts` (token doc) | ✓ | ✗ | ✓ | UNMODIFIED |
| `src/styles/modern.css` | ✗ | ✗ | ✗ | MISSING |
| `src/components/KoSignatureStamp.tsx` (view transition) | ✓ | ✗ | ✓ | UNMODIFIED |

---

## Recommended Next Steps

1. **Complete Wave 1**:
   - Create `src/components/MenuPanel.tsx` and collapse `TerminalViewport.tsx` header to `[MENU]`.
   - Wire `useMatchSession.ts` into `src/App.tsx` and slim `App.tsx` to <=200 lines.
   - Record `01-SUMMARY.md` and `02-SUMMARY.md`.
2. **Execute Wave 2**:
   - Apply CSS calm-down and asymmetric word arena (Plan 5.3).
   - Implement 3-mode idle selector and document gray hierarchy in `palettes.ts` (Plan 5.4).
3. **Execute Wave 3**:
   - Implement modern web design layer: `modern.css`, spring easings, JetBrains Mono, View Transitions (Plan 5.5).
