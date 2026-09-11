# SPEEDTYPE — NEW FEATURES ROADMAP (Phase 6–10)

## Overview
This roadmap addresses the full feature backlog requested in the September 2026 planning session. All phases build on the existing Vite + React 19 + TypeScript + Tailwind stack.

---

## Wave Execution Map

```
Wave 1 (independent, can run in parallel):
  6.1 — Rival AI Variance + Start-on-First-Keystroke
  6.2 — Calibration Overhaul (typo tolerance, raw WPM, reading margin)
  7.1 — Mandatory Player Profile Gate
  10.1 — Rate Limiting + Security

Wave 2 (depends on Wave 1 completing first):
  6.3 — Propagate Mechanics to All Game Modes       [depends: 6.1, 6.2]
  7.2 — Local Leaderboard                           [depends: 7.1]
  8.1 — 1v1 Friend Challenge Codes                  [depends: 7.1]
  9.1 — UI Layout Overhaul                          [depends: 7.1]

Wave 3 (depends on Wave 2):
  9.2 — Calibration + Result + Menu UI Polish       [depends: 9.1, 6.2]
```

---

## Phase Descriptions

### Phase 6: Core Mechanics Overhaul
- **6.1** `feat(rival)`: Variable WPM [-20/+5 band] + start-on-first-keystroke
- **6.2** `feat(calibration)`: Typo tolerance, raw WPM collection, reading-margin live WPM
- **6.3** `feat(modes)`: Propagate both mechanics to Tournament + Weekly Trials

### Phase 7: Identity & Social
- **7.1** `feat(profile)`: Mandatory player profile gate (username + avatar, localStorage)
- **7.2** `feat(leaderboard)`: Local 100-entry leaderboard with per-difficulty ranking

### Phase 8: 1v1 Challenge
- **8.1** `feat(1v1)`: Serverless friend challenge via base64 challenge codes (copy/paste)

### Phase 9: UI Overhaul
- **9.1** `feat(ui)`: Layout redesign — word as hero, unified race strip, spacious layout
- **9.2** `feat(ui)`: Calibration + result modal + menu UI polish

### Phase 10: Security
- **10.1** `feat(security)`: Token-bucket rate limiting + XSS-hardened username validation

---

## Commit Strategy
Every plan ends with:
```
git add -A
git commit -m "<type>(<scope>): <description>"
git push
```

---

## File Ownership Map (for parallel execution safety)

| Plan | Files Owned |
|------|-------------|
| 6.1  | adaptiveRival.ts, useSimpleDuel.ts |
| 6.2  | calibration.ts, TypingTest.tsx |
| 6.3  | TournamentLounge.tsx, WeeklyTrialModal.tsx, weeklyTrials.ts |
| 7.1  | profile/profile.ts, profile/useProfile.ts, ProfileSetupModal.tsx, App.tsx* |
| 7.2  | profile/leaderboard.ts, LeaderboardModal.tsx, MenuModal.tsx* |
| 8.1  | social/challengeCode.ts, ChallengeModal.tsx |
| 9.1  | TerminalViewport.tsx, ModernDuelArena.tsx, crt.css, index.css |
| 9.2  | TypingTest.tsx*, ModernResultModal.tsx, MenuModal.tsx* |
| 10.1 | utils/rateLimiter.ts, App.tsx*, leaderboard.ts*, profile.ts*, challengeCode.ts* |

*App.tsx and MenuModal.tsx are touched by multiple plans — coordinate sequentially.

---

## Design Decisions

### Why no backend for leaderboard/1v1?
The stack is pure frontend (Vite SPA). Adding a backend would require significant infrastructure. The local-first approach delivers 90% of the value immediately. A backend migration path is straightforward when needed.

### Why base64 challenge codes (not URL params)?
URL params get truncated by chat apps. Base64 strings are compact, copyable, and work anywhere. The 20-word timing payload is ~400–600 bytes encoded.

### Why [-20, +5] variance band?
- Negative skew: rivals should occasionally feel easier (human variability)  
- Positive skew capped at +5: rivals shouldn't feel dramatically harder without the player choosing a difficulty bump
- The asymmetry mirrors real human typing variance (you rarely type FASTER than your calibrated max, but you often type slower)

### Reading Margin Formula
`effectiveSec = elapsedSec - (wordsTyped × 0.05)` removes 50ms per word to account for reading recognition time. Blended 70/30 with raw WPM for display stability.
