# Project: SpeedType Feature Completion

## Architecture
SpeedType is a competitive cyber-kinetic typing duel web application built with React, TypeScript, Vite, and Tailwind CSS.
- **Combat Engine (`src/engine/`)**:
  - `useCombatCoordinator.ts`: Coordinates typing input, opponent simulator/playback, kinetic beam physics, combat stats, and match lifecycle.
  - `useTypingEngine.ts`: Manages character-by-character player input, typo detection, streak/overclock multipliers, and blind duel masking.
  - `useKineticBeam.ts`: Tug-of-war beam mechanics, word burst physics, momentum, and baseline knockout conditions.
  - `botOpponent.ts`: Procedural bot simulation driving opponent actions when no ghost is loaded.
  - `dictionary.ts`: Lexicon generator with stance-specific word pools and code syntax words.
- **Social & Replay Engine (`src/social/`)**:
  - `ghostPlayer.ts`: `GhostPlaybackEngine` for timestamp-accurate replay of recorded keystrokes and stance shifts.
  - `ghostRecorder.ts`: Event recording, serialization, and storage for player runs and personal bests.
  - `tournamentSimulator.ts`: 8-contestant bracket data model, fixtures, and round-by-round advancement.
  - `tournamentCommentary.ts`: Event-driven shoutcaster dialogue feed.
  - `wageringEngine.ts`: Multi-stage betting system with odds calculation and payout settlement.
  - `rivalryDossier.ts`: Persistent player profile, rival records, and dynamic `nemesisWords` telemetry.
- **UI Components (`src/components/`)**:
  - `CombatArena.tsx`, `TerminalViewport.tsx`, `WordDisplay.tsx`: Live duel rendering.
  - `TournamentLounge.tsx`: Multi-stage interactive bracket, side-by-side duel view, commentary ticker, and wager interface.
  - `GhostDuelSelector.tsx`: Import/export modal with direct PB and last-run challenge triggers.
  - `RivalryDossierModal.tsx`: Visual display of dynamic nemesis words and rival stats.
  - `WeeklyTrialModal.tsx`: Rules display and trial activation.
- **Sensory Systems (`src/audio/`, `src/utils/`)**:
  - `soundEngine.ts`: Web Audio procedural sound effects.
  - `haptics.ts`: Safe `navigator.vibrate` sensory feedback wrapper.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Ghost Playback Combat Integration | Connect `GhostPlaybackEngine` directly into `useCombatCoordinator` to drive opponent actions from recorded timestamped events | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Stance Event & Word Boundary Replay | Replay exact stance switches and word completions with full beam impact and damage calculation | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Ghost Run Local Persistence | Save personal best and last player runs to `localStorage` under dedicated keys | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Ghost Duel UI Controls | Add `[DUEL PERSONAL BEST]` and `[DUEL LAST RUN]` buttons to `GhostDuelSelector` | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Dynamic Opponent HUD in Ghost Duel | Display ghost challenger name and archetype in battle HUD and dossier | M1 | ORIGINAL_REQUEST §R1 |
| 6 | 8-Contestant Seeded Tournament Pool | Expand `TOURNAMENT_SEEDS` to 8 contestants with distinct archetypes and stats | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Multi-Stage Bracket Progression | Implement Quarterfinals (4 matches) -> Semifinals (2 matches) -> Grand Finals (1 match) with winner advancement | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Live Keystroke Match Simulation | Simulate real-time side-by-side typing progression for tournament matches with WPM cadence and beam push | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Event-Driven Match Commentary | Generate dynamic caster/analyst dialogue triggered by intros, speed surges, typos, low HP, and KOs | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Per-Round Wagering & Settlement | Open betting window before each round (QF, SF, GF), compute odds, and settle KP payouts immediately upon round end | M2 | ORIGINAL_REQUEST §R2 |
| 11 | In-Match Word Typo & Recoil Tracking | Track attempted words, mistyped words, and beam recoil occurrences in `useCombatCoordinator` | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Live Nemesis Words Dossier Recording | Pass `failedWords` and `fatalWord` into `recordMatchInDossier` on match completion to update `dossier.nemesisWords` | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Code Syntax Exact Punctuation & Boost | Enforce case-sensitive punctuation code tokens and apply +50% beam push bonus on word completion | M3 | ORIGINAL_REQUEST §R4 |
| 14 | Blind Duel Masked Typing & Reveal | Flash word for 0.5s, mask characters as `•` during typing, reset token on typo, reveal word on completion | M3 | ORIGINAL_REQUEST §R4 |
| 15 | 1 HP Sudden Death Fatal Recoil & Finisher Gate | Enforce instant fatality on unshielded mistype recoil, shield absorption, and gate finisher duel | M3 | ORIGINAL_REQUEST §R4 |
| 16 | Haptic Sensory Polish (`navigator.vibrate`) | Safe vibration triggers on player mistypes (40ms) and baseline impacts (`[80, 40, 80]`ms) | M3 | ORIGINAL_REQUEST §R4 |
| 17 | E2E Automated Verification & Test Suite | Implement multi-tier automated test suite covering all features, edge cases, and build validation | M4 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | R1 Ghost Duel Playback Engine Integration | `src/social/ghostPlayer.ts`, `src/social/ghostRecorder.ts`, `src/engine/useCombatCoordinator.ts`, `src/components/GhostDuelSelector.tsx`, `src/App.tsx` | none | IN_PROGRESS |
| M2 | R2 Tournament Lounge Interactive Bracket Progression | `src/social/tournamentSimulator.ts`, `src/social/tournamentCommentary.ts`, `src/social/wageringEngine.ts`, `src/components/TournamentLounge.tsx` | none | IN_PROGRESS |
| M3 | R3 Nemesis Telemetry & R4 Weekly Trials Mechanics + Haptics | `src/types/combat.ts`, `src/social/rivalryDossier.ts`, `src/engine/useTypingEngine.ts`, `src/engine/useCombatCoordinator.ts`, `src/engine/useKineticBeam.ts`, `src/engine/dictionary.ts`, `src/engine/botOpponent.ts`, `src/utils/haptics.ts`, `src/App.tsx` | none | IN_PROGRESS |
| M4 | E2E Automated Verification & Hardening | Full test harness, tier 1-4 tests, build check (`tsc`, `vite build`), forensic audit | M1, M2, M3 | PLANNED |

## Interface Contracts

### M1: `GhostPlaybackEngine` ↔ `useCombatCoordinator`
- `GhostPlaybackEngine` methods:
  - `start()`: begins playback clock using `requestAnimationFrame`.
  - `stop()`: cancels animation frame and marks stopped.
  - `pause()` / `resume()`: handles pause toggles.
  - `getStance(): StanceType`: returns active stance of ghost at current timestamp.
  - `getActiveWord(): string`: returns the reconstructed active word ghost is typing.
  - `getProfile(): { name: string; avatar: string; baseWpm: number }`: returns ghost metadata.
- `GhostPlaybackEngine` callbacks:
  - `onCharTyped: (char: string, ok: boolean, stance: StanceType) => void`
  - `onWordCompleted: (word: string, stance: StanceType) => void`
  - `onStanceChanged: (stance: StanceType) => void`
  - `onPlaybackComplete: () => void`
- `useCombatCoordinator.startMatch(opponent: string | GhostRunData)`:
  - If `typeof opponent === 'string'`: uses `BotSimulator`.
  - If `typeof opponent === 'object'` (is `GhostRunData`): uses `GhostPlaybackEngine`.

### M2: `tournamentSimulator` ↔ `TournamentLounge` ↔ `wageringEngine`
- `TournamentContestant`: `{ id, name, title, seed, baseWpm, accuracy, avatar, stance, health, eliminated }`.
- `TournamentMatch`: `{ id, round: 'QF' | 'SF' | 'GF', contestant1, contestant2, winner?: TournamentContestant, status: 'pending' | 'active' | 'completed' }`.
- `TournamentBracket`: `{ rounds: { QF: TournamentMatch[]; SF: TournamentMatch[]; GF: TournamentMatch[] }; currentRound: 'QF' | 'SF' | 'GF'; activeMatchIndex: number }`.
- `tournamentCommentary.ts`:
  - `generateCommentary(event: CommentaryEvent): CommentaryLine`
  - Events: `match_start`, `speed_surge`, `typo_recoil`, `low_health`, `knockout`, `champion_crowned`.
- `WageringEngine`:
  - `placeRoundWager(matchId: string, contestantId: string, amount: number, odds: number): boolean`
  - `resolveRoundWager(winnerId: string): WagerResult | null`

### M3: `useCombatCoordinator` ↔ `rivalryDossier` & Weekly Trials
- `MatchResult`:
  - `winner: 'player' | 'opponent'`
  - `playerStats: CombatStats`
  - `opponentStats: CombatStats`
  - `reason: 'baseline_ko' | 'health_depleted_ko' | 'sudden_death' | 'overclock_burnout'`
  - `failedWords: string[]`
  - `fatalWord?: string`
- `recordMatchInDossier(dossier, rivalName, isWin, playerWpm, kpEarned, failedWords, fatalWord): DossierData`
- `triggerHapticFeedback(pattern: number | number[])`:
  - Mistype: `40` (ms)
  - Baseline impact / KO: `[80, 40, 80]` (ms)

## Code Layout
- `src/engine/`: Core game loop, typing engine, physics, bot opponent, dictionary.
- `src/social/`: Ghost recorder/player, tournament simulator/commentary, wagering, rivalry dossier.
- `src/components/`: React UI components, modals, visualizers.
- `src/utils/`: Utility helpers (haptics, formatting).
- `src/types/`: TypeScript interface and type definitions.
- `test/`: Automated test suite for all tiers.
