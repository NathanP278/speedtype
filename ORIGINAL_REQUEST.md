# Original User Request

## 2026-09-11T00:17:32+08:00

Comprehensive audit and completion of all missing and partial mechanics in SpeedType: real-time ghost replay playback, automated 8-player tournament bracket progression, live nemesis word telemetry recording, and sensory haptic polish.

Working directory: c:/Users/Nathan/Desktop/speedtype
Integrity mode: development

## Requirements

### R1. Live Ghost Duel Playback Engine Integration
Connect `GhostPlaybackEngine` directly into the combat loop so that selecting an imported ghost run or personal best replays the exact timestamped keystrokes and stance switches recorded, instead of fallback bot simulation.

### R2. Tournament Lounge Real Bracket Progression
Upgrade `TournamentLounge` from a simple timer decrement into an interactive, multi-stage tournament bracket (Quarterfinals -> Semifinals -> Grand Finals) with live side-by-side keystroke simulation, match commentary, and wager settlement per round.

### R3. Live Nemesis Words Telemetry Collection
Track every word where the player commits a typo or suffers a beam recoil during a live match, logging them into `dossier.nemesisWords` on match completion so the Rivalry Dossier displays real, dynamic player weaknesses.

### R4. Complete Weekly Trial Mechanics & Sensory Polish
Fully enforce trial-specific modifiers (Code Syntax exact punctuation, Blind Duel masked typing with completion reveal, 1 HP Sudden Death instant recoil fatality) and add `navigator.vibrate` haptic feedback on mistypes and baseline impacts.

## Acceptance Criteria

### Combat & Playback Verification
- [ ] Selecting an imported ghost run faithfully reproduces keystrokes and stance shifts matching original timestamps.
- [ ] Match end accurately logs mistyped words to the Nemesis Words table in the Rivalry Dossier.
- [ ] Tournament bracket advances round-by-round through 8 seeded contestants with accurate payout resolution.
- [ ] All three Weekly Trials enforce their exact rules in-game.
- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` passes with 0 errors.
- [ ] `node ./node_modules/vite/bin/vite.js build` completes cleanly.

## 2026-09-11T00:28:38+08:00

User directive: Those waiting on standby can go continue to the next immediately. Dispatch Milestone 3 (R3: Nemesis Words telemetry tracking) and Milestone 4 (R4: Weekly Trials modifiers & haptics) in parallel without holding.

