---
phase: 6
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/engine/adaptiveRival.ts
  - src/engine/useSimpleDuel.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Rival WPM is never a fixed value; every new match draws a fresh random WPM from a [-20, +5] window around the player's calibrated netWpm (on 'equal' difficulty), scaled proportionally per difficulty level"
    - "Rival typing loop does NOT begin until the player presses their first character key"
    - "Start timer for both player and rival is set on the same first keypress event"
  artifacts:
    - "src/engine/adaptiveRival.ts exports createAdaptiveRivalProfile with variance applied"
    - "src/engine/useSimpleDuel.ts rival loop gated by rivalStarted state that mirrors startTimeRef"
---

# Plan 6.1: Rival AI Variance & Start-on-First-Keystroke

<objective>
Fix the rival AI to be variable (not a fixed WPM clone), and make both player and rival wait for the player's first keystroke before the race begins.

Purpose: The rival currently runs at a mathematically exact WPM from the moment the component mounts, making every match feel scripted and unfair. Games should feel alive — the rival's speed should be unpredictable within a human-realistic band.

Output: Updated `adaptiveRival.ts` with variance math; updated `useSimpleDuel.ts` with deferred-start rival loop.
</objective>

<context>
Load for context:
- src/engine/adaptiveRival.ts
- src/engine/useSimpleDuel.ts
- src/engine/calibration.ts (for UserCalibration type)
</context>

<tasks>

<task type="auto">
  <name>Add WPM variance to adaptive rival profile</name>
  <files>src/engine/adaptiveRival.ts</files>
  <action>
    In `createAdaptiveRivalProfile`, replace the fixed `rivalWpm` calculation with a randomized draw:

    ```
    // Base WPM from multiplier
    const baseWpm = Math.max(25, Math.round(calibration.netWpm * config.multiplier));

    // Variance window: -20 to +5 of base (so rival feels human, not robotic)
    // Scale variance with difficulty: easier modes get a tighter band
    const varianceLow  = -20;
    const varianceHigh =   5;
    const variance = Math.round(varianceLow + Math.random() * (varianceHigh - varianceLow));
    const rivalWpm = Math.max(15, baseWpm + variance);
    ```

    Also export a `drawRivalWpm(calibration, difficulty)` helper that does this draw so `useSimpleDuel` can re-draw on each reset without re-importing the full profile builder.

    AVOID: Seeding with `calibration.timestamp` — must be `Math.random()` so each match is independent.
    AVOID: Allowing rivalry WPM to go below 15 (unplayably slow and jarring).
  </action>
  <verify>TypeScript: `npx tsc --noEmit` — zero errors</verify>
  <done>
    - `createAdaptiveRivalProfile` applies ±variance on every call
    - `drawRivalWpm` exported as standalone helper
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Defer rival loop start until player first keystroke</name>
  <files>src/engine/useSimpleDuel.ts</files>
  <action>
    Add a `rivalStarted` boolean state (default `false`).

    Modify the rival AI loop `useEffect`:
    - Gate the entire `scheduleNextRivalChar` invocation on `rivalStarted === true`.
    - When the `rivalStarted` dependency goes `false → true`, the effect re-runs and actually starts the loop.

    Modify the player keystroke `handleKeyDown`:
    - On the first valid key (when `!startTimeRef.current`): set `startTimeRef.current = Date.now()` AND call `setRivalStarted(true)`.

    Modify `resetDuel`:
    - Reset `rivalStarted` to `false`.

    Also wire up `drawRivalWpm` from `adaptiveRival.ts`:
    - On component init and on `resetDuel`, call `drawRivalWpm(calibration, difficulty)` to get a fresh `rivalTargetWpm`. Store it in `useState<number>` so it's stable per-match but fresh per-reset.

    AVOID: Using `rivalStarted` in the WPM ticker effect — that should still gate on `startTimeRef.current`.
    AVOID: Triggering rival start on Tab or Escape key presses.
  </action>
  <verify>
    1. Open app in browser — rival progress bar stays at 0% until you type.
    2. Type first character — both you and rival begin moving simultaneously.
    3. Reset match — rival stops, waits for your first key again.
    `npx tsc --noEmit` passes.
  </verify>
  <done>
    - Rival bar frozen at 0 before first keypress
    - Both start on first valid keypress
    - Each reset re-draws a fresh rival WPM
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Rival WPM varies visibly between resets (check `rivalTargetWpm` display in UI)
- [ ] Rival bar stays at 0% until player types first character
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(rival): variable WPM ±variance + start-on-first-keystroke"`
- [ ] Git push: `git push`
</success_criteria>
