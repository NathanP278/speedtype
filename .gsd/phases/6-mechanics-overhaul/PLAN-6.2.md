---
phase: 6
plan: 2
wave: 1
depends_on: []
files_modified:
  - src/engine/calibration.ts
  - src/components/TypingTest.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Calibration test allows backspace/correction — typos do NOT block progression"
    - "Raw WPM (grossWpm) and Net WPM (accuracy-adjusted) are both collected and stored"
    - "Live WPM counter during the duel accounts for per-word reading margin (~50ms per word read time)"
    - "The data driving the rival calibration is rawWpm-adjusted-by-accuracy (standard net WPM formula)"
    - "UserCalibration stores rawWpm as a separate field from netWpm"
  artifacts:
    - "src/engine/calibration.ts: UserCalibration has rawWpm field, calculateReadingAdjustedWpm exported"
    - "src/components/TypingTest.tsx: allows backspace, displays both raw and net WPM, corrected char coloring"
---

# Plan 6.2: Calibration Overhaul — Typo Tolerance, Raw WPM & Reading Margin

<objective>
Three sub-goals:
1. Calibration allows typos/backspacing (currently blocking). Collect rawWpm AND netWpm.
2. Live WPM counter in the duel factors in a small per-word reading delay (~50ms/word) so the number is fairer and more stable for slower typists.
3. Both fields stored in UserCalibration and visible in the post-test results screen.

Purpose: Raw WPM = how fast fingers move. Net WPM = raw adjusted for accuracy. Reading margin = acknowledges that humans must read a word before they can type it — removing this time makes WPM artificially inflate for slow/careful readers.

Reading-adjusted WPM formula:
  effectiveTimeSeconds = elapsedSeconds - (wordsCompleted * READING_MARGIN_MS / 1000)
  adjustedWpm = (wordsCompleted / max(1, effectiveTimeSeconds)) * 60
  where READING_MARGIN_MS = 50 (50ms reading recognition window per word)
</objective>

<context>
Load for context:
- src/engine/calibration.ts
- src/components/TypingTest.tsx
- src/engine/useSimpleDuel.ts (for reading-margin WPM integration)
</context>

<tasks>

<task type="auto">
  <name>Extend calibration schema and add reading-margin WPM helper</name>
  <files>src/engine/calibration.ts</files>
  <action>
    1. Add `rawWpm: number` field to `UserCalibration` interface.

    2. Export a new constant: `export const READING_MARGIN_MS = 50;`

    3. Export a new helper:
    ```ts
    /**
     * Adjusts WPM to account for per-word reading recognition time.
     * READING_MARGIN_MS subtracted per completed word from elapsed time.
     * Prevents WPM from over-inflating for slow, careful readers.
     */
    export function calculateReadingAdjustedWpm(
      wordsCompleted: number,
      elapsedSeconds: number
    ): number {
      const readingDeductionSec = (wordsCompleted * READING_MARGIN_MS) / 1000;
      const effectiveSec = Math.max(0.5, elapsedSeconds - readingDeductionSec);
      const effectiveMin = effectiveSec / 60;
      return Math.max(0, Math.round(wordsCompleted / effectiveMin));
    }
    ```

    4. Update `calculateGrossWpm` docstring to call it "Raw WPM" clearly.

    AVOID: Changing existing `calculateNetWpm` formula — it's standard and correct.
    AVOID: Making `rawWpm` optional — always compute it.
  </action>
  <verify>`npx tsc --noEmit` exits 0</verify>
  <done>
    - UserCalibration.rawWpm field exists
    - READING_MARGIN_MS and calculateReadingAdjustedWpm exported
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Overhaul TypingTest: allow corrections, collect rawWpm, update UI</name>
  <files>src/components/TypingTest.tsx</files>
  <action>
    The current approach uses a controlled `<input>` where `value.length > targetText.length` blocks extra chars. Backspace works natively since it's a real input. The problem is the `handleInputChange` fires on every change — backspace already works, but need to verify it does. The real issue: blocked if `value.length > targetText.length`.

    Changes needed:

    1. **Allow backspace freely** — remove the `if (value.length > targetText.length) return;` guard OR clamp to `targetText.length` on the high end only (keep it).

    2. **Error counting fix** — current loops `for i in inputHistory.length` comparing char-by-char. This is correct. But with backspace allowed, some "errors" get corrected. The standard typing test convention: count UNCORRECTED errors only at test-end (characters in wrong position when time runs out). Do not penalize corrected mistakes.

    3. **Collect rawWpm**: 
       - `rawWpm = calculateGrossWpm(totalCharsTyped, elapsedSeconds)` (all keystrokes / 5 / minutes)
       - `netWpm = calculateNetWpm(correctChars, uncorrectedErrors, elapsedSeconds)`
       - Store both in `UserCalibration` result.

    4. **UI updates for results screen**:
       - Show "Raw WPM" (grossWpm) as secondary stat
       - Show "Net WPM" (netWpm) as the primary hero number
       - Add small explainer: "Net WPM = Raw WPM adjusted for uncorrected errors"

    5. **Live counter during test**: Show both `liveStats.grossWpm` (labeled "Raw") and `liveStats.netWpm` (labeled "Net") in the stat ribbon. Remove the standalone "Gross WPM" column; rename the columns to "Raw WPM" and "Net WPM".

    6. **Word count tracking**: track `wordsCompletedInTest` (spaces typed = word boundaries) for reading-margin display only (informational).

    AVOID: Changing the passage text or passage length — keep 30s and 4 passages.
    AVOID: Implementing the reading margin in the calibration test itself — that's only for the live duel counter. The calibration captures raw+net only.
  </action>
  <verify>
    1. Type a wrong character, press backspace — error highlights disappear, corrected char shows green.
    2. On test completion, results screen shows both Raw WPM and Net WPM.
    3. `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Backspace corrections work visually and in stats
    - Results screen shows rawWpm + netWpm
    - UserCalibration.rawWpm is populated on save
  </done>
</task>

<task type="auto">
  <name>Apply reading-margin WPM to live duel counter in useSimpleDuel</name>
  <files>src/engine/useSimpleDuel.ts</files>
  <action>
    In the WPM ticker `useEffect` (the 200ms interval):

    Replace:
    ```ts
    const liveWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
    ```

    With:
    ```ts
    import { calculateReadingAdjustedWpm } from './calibration.ts';
    // ...
    const rawWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
    const adjusted = calculateReadingAdjustedWpm(playerWordIndex, elapsedSec);
    // Blend: 70% adjusted + 30% raw for stability, prevents wild swings
    const liveWpm = Math.round(adjusted * 0.7 + rawWpm * 0.3);
    setCurrentWpm(liveWpm);
    ```

    Also expose `rawWpm` in the returned `playerStats` object for display purposes.

    AVOID: Using reading-adjusted WPM for the final match result — use the standard net WPM formula there.
  </action>
  <verify>
    1. Start a duel match — WPM counter starts at 0.
    2. Complete a few words — WPM rises more smoothly than before.
    3. `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Reading-margin adjustment applied to live WPM counter
    - No TypeScript errors
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Backspace in calibration test works correctly
- [ ] Both rawWpm and netWpm stored in UserCalibration
- [ ] Live duel WPM uses reading-adjusted formula
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(calibration): typo tolerance, raw WPM tracking, reading-margin live WPM"`
- [ ] Git push: `git push`
</success_criteria>
