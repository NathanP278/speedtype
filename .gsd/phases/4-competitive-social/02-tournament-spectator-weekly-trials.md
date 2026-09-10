---
phase: 4
plan: 2
wave: 2
depends_on:
  - "4.1"
files_modified:
  - "src/social/tournamentSimulator.ts"
  - "src/social/wageringEngine.ts"
  - "src/components/TournamentLounge.tsx"
  - "src/components/SpectatorLane.tsx"
  - "src/components/AsciiReactionOverlay.tsx"
  - "src/trials/weeklyTrials.ts"
  - "src/components/WeeklyTrialModal.tsx"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Tournament Lounge simulates 4-8 player brackets with side-by-side stream visualization."
    - "Spectator Pit enables mini shard wagering with odds calculation and KP payout resolution."
    - "Live ASCII reaction bar allows spamming floating terminal emotes over active streams."
    - "Weekly Themed Trials support rotating modifiers: Code Syntax Only, Blind Duel, and 1 HP Sudden Death."
  artifacts:
    - "src/social/tournamentSimulator.ts manages bracket seeds, automated matches, and progressions"
    - "src/social/wageringEngine.ts handles shard bets, odds multiplier calculations, and payouts"
    - "src/components/TournamentLounge.tsx renders the spectator pit and multi-lane viewing grid"
    - "src/trials/weeklyTrials.ts implements match modifier rules and validation"
---

# Plan 4.2: Tournament Lounge, Spectator Wagering & Weekly Trials

<objective>
Implement the 4-8 player Tournament Lounge & Spectator Pit with live multi-lane streams, mini shard wagering, live ASCII reaction spam, and the Weekly Themed Trials with special combat modifiers.

Purpose: Provide esports spectating excitement, risk-reward betting, and distinct rule-bending weekly challenge modes.
Output: Tournament simulation engine, wagering math engine, tournament lounge view, ASCII reaction overlay, and weekly trials system.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/economy/economyState.ts
- src/social/ghostPlayer.ts
- src/engine/useCombatCoordinator.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Tournament Simulation Engine & Shard Wagering System</name>
  <files>src/social/tournamentSimulator.ts, src/social/wageringEngine.ts</files>
  <action>
    Construct `tournamentSimulator.ts`:
    - Generates 4 or 8 seeded AI/ghost combatants with unique handles, avatars, stance preferences, and WPM attributes.
    - Manages bracket rounds (Quarter-finals, Semi-finals, Grand Finals) with real-time match progression.
    Construct `wageringEngine.ts`:
    - Computes betting odds ($1.2\times$ to $5.5\times$) based on seed ranking and historical WPM differentials.
    - Allows the user to wager KP shards on any bracket competitor prior to each round.
    - Resolves wagers and transfers payouts to the user's persistent KP balance upon match conclusion.
    AVOID: Allowing wagers after a match has started; lock betting states as soon as the countdown timer reaches zero.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Bracket generates and advances matches, and wagering awards accurate returns</done>
</task>

<task type="auto">
  <name>Build Multi-Lane Tournament Lounge, Spectator Pit & ASCII Reaction Bar</name>
  <files>src/components/TournamentLounge.tsx, src/components/SpectatorLane.tsx, src/components/AsciiReactionOverlay.tsx</files>
  <action>
    Develop `TournamentLounge.tsx` and `SpectatorLane.tsx`:
    - Grid of simultaneous match lanes showing real-time word progress, kinetic beam displacement, and active stances for each competitor.
    - Center stage focusing on the featured match with live commentary tickers.
    Develop `AsciiReactionOverlay.tsx`:
    - Reaction toolbar with clickable terminal emotes: `[GG]`, `[PWND]`, `[CLUTCH]`, `(╯°□°)╯`, `[REKT]`, `[OVERCLOCK]`.
    - Spawns floating ASCII emotes that drift upward with random horizontal jitter across the spectator stream.
    AVOID: Uncontrolled DOM node accumulation; cap active floating reactions at 30 and remove nodes from DOM after animation completes.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Multi-lane tournament renders smoothly with responsive spectator betting and floating reaction emotes</done>
</task>

<task type="auto">
  <name>Implement Weekly Themed Trials with Dynamic Modifiers</name>
  <files>src/trials/weeklyTrials.ts, src/components/WeeklyTrialModal.tsx</files>
  <action>
    Develop `weeklyTrials.ts`:
    - Trial 1: "Code Syntax Only" — replaces standard dictionary with language tokens (Rust `fn main() -> Result<()>`, C++ `std::unique_ptr<T>`, JS `async ({ data }) =>`).
    - Trial 2: "Blind Duel" — muscle memory mode where typed letters render as masked asterisks/dots until the full word is validated.
    - Trial 3: "1 HP Sudden Death" — both players start at 1 HP; any typo or unabsorbed beam recoil triggers instant defeat.
    Develop `WeeklyTrialModal.tsx`:
    - Selector displaying active weekly trial, trial rules, modifier badges, and bonus KP reward bounty.
    - Connects selected trial modifiers directly into the combat engine loop.
    AVOID: Hardcoding dates that break after 2026; compute active trial rotation deterministically using the ISO week number.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Weekly trials apply correct combat modifiers and award bonus KP bounties on completion</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript check passes with zero errors
- [ ] Tournament bracket runs 4-8 players and settles shard bets
- [ ] Code Syntax, Blind Duel, and 1 HP Sudden Death modifiers alter gameplay appropriately
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
