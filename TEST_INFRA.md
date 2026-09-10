# E2E Test Infra: SpeedType Mechanics Completion

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on private implementation internals.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
- Strict verification: TypeScript typechecking (`tsc --noEmit`), Vite production build, and automated test harness execution with zero regressions.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Ghost Playback Combat Integration | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Stance Event & Word Boundary Replay | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Ghost Run Local Persistence (PB & Last Run) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Ghost Duel UI Controls & Duel Trigger | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Dynamic Opponent HUD in Ghost Duel | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | 8-Contestant Seeded Tournament Pool | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Multi-Stage Bracket Progression (QF -> SF -> GF) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Live Keystroke Match Simulation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Event-Driven Match Commentary | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Per-Round Wagering & Payout Settlement | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 11 | In-Match Word Typo & Recoil Tracking | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | Live Nemesis Words Dossier Recording | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | Code Syntax Exact Punctuation & Boost (+50%) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 14 | Blind Duel Masked Typing & Completion Reveal | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 15 | 1 HP Sudden Death Fatal Recoil & Finisher Gate | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 16 | Haptic Sensory Polish (navigator.vibrate safe calls) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Node-executable test harness (e.g. `test/run-all-tests.ts` executed via `npx tsx` or `node`) validating functional correctness, invariants, and edge cases.
- Test case format: Pure TypeScript tests with assertion receipts, exiting 0 on full pass and non-zero on failure.
- Directory layout:
  - `test/e2e/tier1-features/`
  - `test/e2e/tier2-boundary/`
  - `test/e2e/tier3-cross-feature/`
  - `test/e2e/tier4-scenarios/`
  - `test/run-all-tests.ts`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Personal Best Ghost Match: record live run, select PB, replay exact timestamps, verify stance shifts and beam push | F1, F2, F3, F4, F5 | High |
| 2 | Full 8-Player Tournament Run: seed 8 players, place QF bets, watch live typing duel, settle payouts, advance SF -> GF, crown champion | F6, F7, F8, F9, F10 | High |
| 3 | Nemesis Weakness Profiling: play match with intentional typos on target words, suffer beam recoils, verify dossier ranking | F11, F12 | Medium |
| 4 | Weekly Trial Triad: play Code Syntax (exact punctuation, +50% boost), Blind Duel (masked typing, typo reset), 1 HP Sudden Death (unshielded recoil fatality) | F13, F14, F15, F16 | High |
| 5 | Cross-System Endurance: Tournament payout funding duel wagers while ghost replay runs concurrently with haptic sensory feedback | F1-F16 | Complex |

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature (16 features * 5 = 80 test cases)
- Tier 2: ≥5 boundary test cases per feature (16 features * 5 = 80 test cases)
- Tier 3: Pairwise coverage across major feature interactions (≥16 test cases)
- Tier 4: ≥5 realistic end-to-end application scenarios
- Total Target: ~180+ automated assertions
