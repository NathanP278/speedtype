---
phase: 9
plan: 2
wave: 2
depends_on: [9.1]
files_modified:
  - src/components/TypingTest.tsx
  - src/components/ModernResultModal.tsx
  - src/components/MenuModal.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Calibration test UI feels spacious and readable — not cramped"
    - "Result screen clearly distinguishes Raw WPM vs Net WPM with visual hierarchy"
    - "MenuModal uses a clean grid layout, not a vertical list"
    - "All modals have consistent padding (p-8), max-width (max-w-lg), and rounded-2xl borders"
  artifacts:
    - "TypingTest.tsx — redesigned with generous passage zone and clear stat ribbon"
    - "ModernResultModal.tsx — updated stat cards with raw/net WPM"
    - "MenuModal.tsx — grid layout for mode buttons"
---

# Plan 9.2: Calibration + Result + Menu UI Polish

<objective>
Polish the three remaining key UIs:
1. TypingTest (calibration) — passage display needs more room, stat ribbon less cramped
2. ModernResultModal — now needs to show raw + net WPM from Plan 6.2
3. MenuModal — vertical button list feels dated; convert to 2-col grid

Output: All three components with improved spacing and updated to consume Plan 6.2's rawWpm data.
</objective>

<context>
Load for context:
- src/components/TypingTest.tsx
- src/components/ModernResultModal.tsx
- src/components/MenuModal.tsx
- src/engine/calibration.ts (UserCalibration with rawWpm field from Plan 6.2)
</context>

<tasks>

<task type="auto">
  <name>Polish TypingTest calibration UI</name>
  <files>src/components/TypingTest.tsx</files>
  <action>
    **Stat ribbon** (4 cols → 3 cols):
    - Remove the separate "Gross WPM" column (redundant with new "Raw WPM" label in another column)
    - Columns: Timer | Net WPM (primary, theme-colored) | Raw WPM (secondary, zinc-300) | Accuracy
    - Each stat cell: `p-4` (not `p-2.5`), taller

    **Passage zone**:
    - Increase font size from `text-lg md:text-xl` to `text-xl md:text-2xl`
    - Increase padding from `p-6` to `p-8`
    - Line height: `leading-loose` (not `leading-relaxed`)
    - Min-height: `min-h-[160px]`

    **"Waiting to start" state**:
    - When `!startTime`, show a soft overlay text center of passage: "Start typing…" in zinc-600
    - Passage text visible but slightly opacity-50 until first keystroke

    **Results screen**:
    - Hero stat: Net WPM (large, theme-colored)
    - Secondary stat row: Raw WPM | Accuracy | Keys Correct/Total
    - Remove the "Gross Speed" / "Raw WPM" confusion — use consistent labels
    - Rival tuned notice: show range instead of fixed WPM: "Rival range set to {netWpm-20}–{netWpm+5} WPM"

    **"Type to start" hint**:
    - Replace current hint text with: "⚡ Start typing to begin the 30-second countdown"

    AVOID: Changing the passage text content or TEST_DURATION_SECONDS.
  </action>
  <verify>
    - Passage text is large and readable
    - Stat ribbon shows Net WPM and Raw WPM separately
    - `npx tsc --noEmit` exits 0
  </verify>
  <done>
    - 3-col stat ribbon
    - Larger passage zone
    - Results screen shows rival range not fixed WPM
  </done>
</task>

<task type="auto">
  <name>Update ModernResultModal and MenuModal layout</name>
  <files>src/components/ModernResultModal.tsx, src/components/MenuModal.tsx</files>
  <action>
    **ModernResultModal.tsx**:
    - Add `playerRawWpm?: number` to `DuelResultData` interface (optional for backwards compat)
    - In result display, if `rawWpm` available:
      - Show Net WPM as hero (big, themed)
      - Below it: small row "Raw: {rawWpm} WPM — Adjusted for {100 - accuracy}% error rate"
    - Increase padding: `p-8` not `p-6`
    - Button row: stack vertically on mobile (`flex-col sm:flex-row`)

    **MenuModal.tsx**:
    - Replace the vertical button list with a `grid grid-cols-2 gap-3`:
      - [TOURNAMENT] [GHOST DUEL]
      - [LEADERBOARD] [1v1 CHALLENGE]
      - [RIVALRY DOSSIER] [WEEKLY TRIALS]
      - [BLACK MARKET] (full-width, bottom)
    - Each button: `p-4 rounded-xl border border-zinc-800 hover:border-[var(--theme-text)] flex flex-col items-center gap-1`
    - Add an icon or emoji prefix to each button for quick scanning
    - Settings section (CRT/scanlines toggles) stays below the grid as a separate row

    AVOID: Removing any existing menu button functionality.
    AVOID: Making MenuModal full-screen — keep it as a centered modal, max-w-md.
  </action>
  <verify>
    - MenuModal shows 2-column grid
    - Result modal shows raw WPM when available
    - `npx tsc --noEmit` exits 0
  </verify>
  <done>
    - 2-col menu grid renders
    - DuelResultData has playerRawWpm field
    - TypeScript clean
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Calibration test is spacious and readable
- [ ] Result modal shows raw vs net WPM
- [ ] Menu is 2-column grid
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(ui): calibration, result, and menu UI polish"`
- [ ] Git push: `git push`
</success_criteria>
