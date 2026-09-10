---
phase: 4
plan: 1
wave: 1
depends_on:
  - "3.2"
files_modified:
  - "src/social/ghostRecorder.ts"
  - "src/social/ghostPlayer.ts"
  - "src/social/rivalryDossier.ts"
  - "src/components/RivalryDossierModal.tsx"
  - "src/components/GhostDuelSelector.tsx"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Keystroke recorder captures microsecond-accurate run deltas including characters, stances, and errors."
    - "Ghost playback engine reproduces recorded keystroke runs in real time as an opponent in duels."
    - "Replays can be exported and imported via base64 encoded strings or saved locally."
    - "The Rivalry Dossier tracks lifetime W/L stats, WPM differential, and dynamically identifies specific Nemesis Words."
  artifacts:
    - "src/social/ghostRecorder.ts serializes matches into compressed keystroke streams"
    - "src/social/ghostPlayer.ts replays recorded runs with precise timing synchronization"
    - "src/social/rivalryDossier.ts calculates stats, streaks, and nemesis word rankings"
    - "src/components/RivalryDossierModal.tsx renders the tactical profile dashboard"
---

# Plan 4.1: Asynchronous Ghost Duels & The Rivalry Dossier

<objective>
Implement the Asynchronous Ghost Duel system with keystroke recording/playback, and the Rivalry Dossier tracking lifetime head-to-head records and dynamically detected Nemesis Words.

Purpose: Enable asynchronous competition against friends' runs and provide actionable statistical insights into typing weaknesses.
Output: Ghost run recorder, ghost replay engine, rivalry dossier analytics engine, dossier modal dashboard, and ghost selection dialog.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/types/combat.ts
- src/engine/useTypingEngine.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Ghost Run Keystroke Recorder and Playback Engine</name>
  <files>src/social/ghostRecorder.ts, src/social/ghostPlayer.ts, src/components/GhostDuelSelector.tsx</files>
  <action>
    Construct `ghostRecorder.ts`:
    - Records start timestamp, delta offsets for every key event (`char`, `correct`, `stance`, `timestamp`), and final match summary.
    - Exports serialize / deserialize functions compressing keystroke logs into compact base64 strings for sharing via clipboard or URL hashes.
    Construct `ghostPlayer.ts`:
    - Replay driver scheduling keystrokes according to recorded timestamps using high-resolution timers (`performance.now()`).
    - Feeds simulated keystrokes into the combat coordinator as the opponent.
    - Pre-loads 3 challenging built-in ghost archetypes: 'Ada-01' (75 WPM, 99% accuracy), 'Shinobi-X' (115 WPM burst speed), and 'Glitch-Daemon' (disrupt stance specialist).
    Construct `GhostDuelSelector.tsx` for picking opponents or pasting a friend's replay code.
    AVOID: Using `setInterval` for playback which drifts over time; calculate delta offsets against `performance.now()`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Recorder serializes runs, and playback engine accurately reproduces ghost typing speeds</done>
</task>

<task type="auto">
  <name>Implement The Rivalry Dossier Analytics & Nemesis Words Tracker</name>
  <files>src/social/rivalryDossier.ts, src/components/RivalryDossierModal.tsx</files>
  <action>
    Develop `rivalryDossier.ts`:
    - Persistent store of match histories, lifetime wins/losses, average WPM, and peak burst speed.
    - Nemesis Words engine: logs every word encountered, tracking total attempts, mistyped characters, and deaths occurring while that word was active. Calculates an 'infamy score' to rank the top 10 Nemesis Words.
    Develop `RivalryDossierModal.tsx`:
    - Military terminal dossiers layout with classified folder aesthetic.
    - Displays Head-to-Head win percentages, WPM differential comparison bar, and Nemesis Words hit-list table with accuracy rates and recommendations.
    AVOID: Unbounded array growth in localStorage; cap match history at the 100 most recent runs and aggregate older stats into rolling summaries.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Dossier calculates accurate lifetime statistics and highlights player nemesis words</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript compilation succeeds with zero errors
- [ ] Ghost replays match the exact timing of the source recording
- [ ] Mistyped words are properly registered in the Nemesis Words tracker
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
