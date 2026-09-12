---
phase: 13
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/engine/calibration.ts
  - src/engine/adaptiveRival.ts
  - src/engine/useSimpleDuel.ts
  - src/social/tournamentSimulator.ts
autonomous: true
must_haves:
  truths:
    - "Player WPM calculation is based strictly on (correctKeystrokes / 5) / elapsedMinutes, not raw word-count division"
    - "Reading-adjusted WPM operates on standard 5-character words, eliminating artificial 35% speed compression on long words"
    - "Rival AI character typing schedule uses drift-free timestamp calculation so rival finishes at exactly its drawn target WPM"
    - "Rival WPM variance is symmetric ([-5, +5] on equal difficulty), giving fair 50/50 odds on even match"
    - "Eliminated contradiction where player with 54 WPM beats rival at 74 WPM"
  artifacts:
    - "src/engine/calibration.ts with standardized keystroke WPM formula"
    - "src/engine/adaptiveRival.ts with balanced difficulty curves and symmetric variance"
    - "src/engine/useSimpleDuel.ts with drift-compensated rival scheduling and accurate metric reporting"
---

# Plan 13.1: WPM Math Normalization & Rival AI Pacing Engine

<objective>
Fix the fundamental mathematical flaw in WPM calculations and rival AI speed simulation that caused players typing at 75+ WPM to be displayed at 54 WPM while winning against 74 WPM rivals.
1. Standardize all WPM calculations to industry-standard 5-character word metrics: `(keystrokes / 5) / minutes`.
2. Fix `calculateReadingAdjustedWpm` in `src/engine/calibration.ts` to deduce reading margin from elapsed time while scaling standard typing words, never dividing raw completed word count.
3. Replace laggy chained `setTimeout` character scheduling in `src/engine/useSimpleDuel.ts` with target-timestamp delta tracking to eliminate cumulative browser timer drift.
4. Rebalance difficulty variance in `src/engine/adaptiveRival.ts` from negative-skewed `[-20, +5]` to balanced `[-5, +5]` on equal mode, ensuring rivals are genuinely competitive and not losing 95% of the time.
5. Standardize WPM variance and calculation consistency in `src/social/tournamentSimulator.ts`.

Purpose: Restore competitive integrity and mathematical honesty so displayed WPM reflects true typing speed and rival finishes at its declared target speed.
Output: Hardened calibration math, drift-free rival AI engine, and balanced difficulty curves.
</objective>

<context>
Load for context:
- src/engine/calibration.ts
- src/engine/adaptiveRival.ts
- src/engine/useSimpleDuel.ts
- src/social/tournamentSimulator.ts
</context>

<tasks>

<task type="auto">
  <name>Standardize WPM formulas and fix reading-adjusted calculation</name>
  <files>src/engine/calibration.ts, src/engine/useSimpleDuel.ts</files>
  <action>
    1. In `src/engine/calibration.ts`:
       - Refactor `calculateReadingAdjustedWpm`:
         Instead of `wordsCompleted / effectiveMin` (which penalizes long words by 35%+), calculate:
         `const standardWords = correctKeystrokes / 5;`
         `const effectiveSec = Math.max(0.5, elapsedSeconds - (wordsCompleted * READING_MARGIN_MS) / 1000);`
         `return Math.max(0, Math.round(standardWords / (effectiveSec / 60)));`
       - Ensure `calculateNetWpm`, `calculateGrossWpm`, and `calculateAccuracy` handle zero or negative edge cases cleanly.
    2. In `src/engine/useSimpleDuel.ts`:
       - Update the live interval ticker (lines 85-103) to pass `correctKeystrokes` to `calculateReadingAdjustedWpm`.
       - Blend raw WPM and reading-adjusted WPM consistently.
       - Ensure `endDuel` passes the true calculated `finalPlayerWpm` and `rawCurrentWpm` to `DuelResultData`.

    AVOID: Dividing `wordsCompleted` directly by minutes — English words in `DUEL_WORD_POOL` average 6.5 characters, so raw word count severely deflates actual typing speed.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - `calculateReadingAdjustedWpm` uses `correctKeystrokes / 5` instead of raw word count.
    - Player typing 20 words (130 chars) in 20s displays ~78 WPM, not 54 WPM.
  </done>
</task>

<task type="auto">
  <name>Eliminate rival timer drift and rebalance difficulty variance</name>
  <files>src/engine/adaptiveRival.ts, src/engine/useSimpleDuel.ts</files>
  <action>
    1. In `src/engine/adaptiveRival.ts`:
       - Rebalance `drawRivalWpm`:
         Replace `varianceLow = -20; varianceHigh = 5;` with symmetric variance:
         `relaxed`: multiplier 0.85, variance [-5, +5]
         `equal`: multiplier 1.00, variance [-5, +5] (average variance is 0, fair 50% matchup)
         `challenger`: multiplier 1.15, variance [-4, +6]
         `boss`: multiplier 1.30, variance [-3, +7]
    2. In `src/engine/useSimpleDuel.ts`:
       - Replace chained `setTimeout` with target timestamp calculation:
         When match starts at `t0 = Date.now()`, for character index `c` out of total match characters:
         `expectedTimeMs = (c / charsPerSec) * 1000;`
         `nextDelay = Math.max(10, (t0 + expectedTimeMs) - Date.now() + jitter);`
       - This guarantees zero cumulative drift regardless of browser event loop scheduling.
       - Add a brief natural inter-word pause (80-150ms) modeled into the timestamp so rival typing cadence looks human.

    AVOID: Relying on raw chained `setTimeout(..., delay)` which accumulates 5-15ms browser delay per character and makes rivals up to 25% slower than their advertised WPM.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - Equal difficulty rival averages player's calibrated WPM with ±5 variance.
    - Rival finishes 20 words in target seconds corresponding to its WPM (e.g. 74 WPM rival takes ~21s, not 28s).
    - Player at 54 WPM losing to 74 WPM rival is physically and mathematically consistent.
  </done>
</task>

<task type="auto">
  <name>Synchronize tournament simulator and bot WPM calculations</name>
  <files>src/social/tournamentSimulator.ts</files>
  <action>
    1. In `src/social/tournamentSimulator.ts`:
       - Ensure all bot contestant speeds and matchup calculations use consistent symmetric variance.
       - Verify `computeMatchupOdds` uses standard effective speed formulas `baseWpm * accuracy`.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - Tournament contestant speeds and odds match the updated core engine standards.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `calculateReadingAdjustedWpm` in `calibration.ts` scales by standard 5-char words.
- [ ] `useSimpleDuel.ts` ticker calculates accurate WPM matching typing benchmark standards.
- [ ] Rival AI in `useSimpleDuel.ts` runs at exact target WPM without timer drift.
- [ ] Equal difficulty mode has fair 50/50 win-loss distribution.
- [ ] `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
