---
phase: 1
plan: 2
wave: 2
depends_on:
  - "1.1"
files_modified:
  - "src/engine/useKineticBeam.ts"
  - "src/engine/useOverclock.ts"
  - "src/engine/useFinisherDuel.ts"
  - "src/engine/useCombatCoordinator.ts"
  - "src/engine/botOpponent.ts"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Kinetic Beam dynamically shifts between -100 and +100 based on correct keystrokes, word completions, and typo recoils."
    - "Overclock State activates after 30 consecutive clean characters, doubling word damage and terminating on the first typo."
    - "Finisher Word activates when either opponent drops below 10% HP, locking screen for a 12-15 letter boss duel."
    - "Finisher victory triggers theatrical KO; defending clutch restores 25% health and fills super meter."
  artifacts:
    - "src/engine/useKineticBeam.ts manages tug-of-war position and baseline threshold checks"
    - "src/engine/useOverclock.ts manages 30-streak detection, multipliers, and termination"
    - "src/engine/useFinisherDuel.ts handles the 12-15 letter boss duel state machine"
    - "src/engine/botOpponent.ts provides configurable AI opponent archetypes"
---

# Plan 1.2: Tug-of-War Kinetic Beam, Overclock & Finisher Word Duel

<objective>
Implement the central combat mechanics: the Tug-of-War Kinetic Beam, Overclock State streak engine, high-stakes Finisher Word duel, and the bot simulation engine.

Purpose: Complete the moment-to-moment combat loop that turns speed typing into a dramatic competitive fighter.
Output: Kinetic beam state manager, Overclock state hook, Finisher duel state machine, and Bot opponent simulator.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/types/combat.ts
- src/engine/dictionary.ts
- src/engine/useTypingEngine.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Tug-of-War Kinetic Beam Physics and State Engine</name>
  <files>src/engine/useKineticBeam.ts</files>
  <action>
    Build `useKineticBeam` to track beam position in range [-100, 100], velocity, tension, and recoil.
    - Correct character pushes beam +2.5 (+5.0 in Strike stance).
    - Completed word adds burst push (+10.0 to +25.0 depending on word length and Overclock).
    - Typo recoils beam -4.0 and induces brief recoil freeze (120ms).
    - Detect baseline push (+100 or -100) to trigger instant Knockout.
    AVOID: Simple linear increments without dampening; apply momentum easing so the beam feels like a physical energy struggle.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Beam values accurately reflect keystrokes and enforce knockout boundaries at [-100, 100]</done>
</task>

<task type="auto">
  <name>Implement Overclock State Tracker and Multiplier System</name>
  <files>src/engine/useOverclock.ts</files>
  <action>
    Create `useOverclock` tracking consecutive clean keystrokes:
    - When consecutive clean characters >= 30, activate `isOverclocked = true`.
    - Provide 2.0x damage multiplier for word completion and beam push.
    - Export audio ducking flag and ghost-trail intensity scalar for sensory systems.
    - On any typo, immediately deactivate Overclock, reset streak counter to 0, and signal audio recovery.
    AVOID: Allowing backspaces to retroactively repair an Overclock streak; once a typo occurs, the streak is lost.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Clean typing builds streak to 30 to activate Overclock; single typo instantly cancels state</done>
</task>

<task type="auto">
  <name>Implement Finisher Word Duel and Combat Coordinator with Bot Engine</name>
  <files>src/engine/useFinisherDuel.ts, src/engine/botOpponent.ts, src/engine/useCombatCoordinator.ts</files>
  <action>
    Create `useFinisherDuel`:
    - Checks if Player HP or Opponent HP <= 10%.
    - If triggered: lock standard queues, select random 12-15 letter boss word from vocabulary.
    - If attacker wins: trigger instant theatrical KO.
    - If defender clutches: grant +25% HP rebound and 100% Super Meter.
    Create `botOpponent.ts` with configurable WPM, accuracy, stance preferences, and reaction latency to drive simulated duels.
    Combine systems inside `useCombatCoordinator.ts` to orchestrate health, beam, stances, and win states.
    AVOID: Unsynchronized duel clocks; both combatants must receive the identical boss word at the same microsecond.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Coordinator arbitrates full match lifecycle from start through Overclock, Finisher, and KO</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript check passes with zero errors
- [ ] Overclock cleanly toggles at 30 streak threshold and resets on typo
- [ ] Finisher Word duel activates at <= 10% HP and executes rebound / KO branches
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
