---
phase: 6
plan: 3
wave: 2
depends_on: [6.1, 6.2]
files_modified:
  - src/components/TournamentLounge.tsx
  - src/trials/weeklyTrials.ts
  - src/components/WeeklyTrialModal.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Tournament matches do NOT auto-start — they wait for player to press a key or click a start button"
    - "All simulated WPM values in TournamentLounge use the same variance logic from drawRivalWpm"
    - "Weekly Trials use the same start-on-keypress mechanic as the main duel"
    - "WPM displayed during tournament simulation uses the reading-adjusted formula"
  artifacts:
    - "TournamentLounge contestant WPMs drawn via drawRivalWpm or equivalent variance function"
    - "WeeklyTrialModal / trial engine respects start-on-keypress before rival begins"
---

# Plan 6.3: Propagate Mechanics to All Game Modes

<objective>
Ensure tournament simulation and weekly trials share the same mechanics as the main duel:
- Variable WPM (not fixed) for all AI contestants
- Start-on-first-keypress for interactive trial modes

Purpose: Consistency across all modes — the user shouldn't experience a different "feel" when switching between the main duel, tournaments, and weekly trials.

Output: Updated TournamentLounge.tsx with variance-seeded contestant WPMs; WeeklyTrialModal start-on-keypress integration.
</objective>

<context>
Load for context:
- src/engine/adaptiveRival.ts (drawRivalWpm helper from Plan 6.1)
- src/components/TournamentLounge.tsx
- src/trials/weeklyTrials.ts
- src/components/WeeklyTrialModal.tsx
</context>

<tasks>

<task type="auto">
  <name>Apply WPM variance to tournament contestant simulation</name>
  <files>src/components/TournamentLounge.tsx</files>
  <action>
    TournamentLounge simulates keystroke progression for contestants.
    Locate where contestant `baseWpm` drives the simulation timer delays.

    1. Import `drawRivalWpm` from `../engine/adaptiveRival.ts`.
    2. When initializing bracket/match state, replace any fixed `contestant.baseWpm` usage in simulation loops with a per-match draw: `const effectiveWpm = contestant.baseWpm + Math.round(-20 + Math.random() * 25)` (same -20/+5 window). Clamp to minimum 15.
    3. Apply this draw when a match is "activated" (status transitions to 'active'), not at bracket init.
    4. Expose the effective WPM in the match UI so the user can see it fluctuate between rounds.

    AVOID: Redrawing WPM mid-match — draw once on match activation, keep stable for that match's duration.
    AVOID: Touching the wagering odds calculation — leave that as-is (based on seed, not live WPM).
  </action>
  <verify>
    Open Tournament Lounge, run two consecutive quarterfinals — same contestant should show different WPM each time.
    `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Contestant effective WPM varies per match activation
    - WPM shown in match UI
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Add start-on-keypress to Weekly Trials interactive mode</name>
  <files>src/trials/weeklyTrials.ts, src/components/WeeklyTrialModal.tsx</files>
  <action>
    Weekly Trials include interactive modes (Code Syntax, Blind Duel, 1 HP Sudden Death) where the player types words.
    
    In WeeklyTrialModal (or wherever the trial typing loop lives):
    1. Add a `trialStarted` boolean state, default `false`.
    2. Any rival/bot simulation inside trial mode must gate on `trialStarted`.
    3. Set `trialStarted = true` on the player's first keypress (same pattern as Plan 6.1).
    4. Display a "Press any key to begin…" prompt when `!trialStarted`.
    5. On trial reset, set `trialStarted = false`.

    If the trial mode has no interactive typing loop (purely UI/modal), skip this task for that mode and add a TODO comment noting it needs a typing engine integration in a future phase.

    AVOID: Starting boss/rival simulation before the player has pressed a key.
  </action>
  <verify>
    Open a Weekly Trial — rival/simulation stays frozen until you type the first character.
    `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Trial modes show "press any key" before starting
    - Rival does not move until player first keypress
    - No TypeScript errors
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Tournament contestant WPMs vary between matches
- [ ] Weekly Trial starts on first keypress
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(modes): propagate variance WPM + start-on-keypress to all game modes"`
- [ ] Git push: `git push`
</success_criteria>
