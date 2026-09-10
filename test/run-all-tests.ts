/**
 * SpeedType Master Automated Test Runner (Tiers 1 to 4)
 * Orchestrates complete verification across all requirements:
 * - R1: Ghost Duel Playback Engine Integration (F1-F5)
 * - R2: Tournament Lounge Bracket Progression & Wagering (F6-F10)
 * - R3: Nemesis Words Telemetry Collection (F11-F12)
 * - R4: Weekly Trials Mechanics & Haptic Sensory Polish (F13-F16)
 */

import { runAllRegisteredSuites, resetSuites } from './test-harness.ts';

// Tier 1: Feature Coverage (80 tests)
import { registerTier1GhostTests } from './e2e/tier1-features/tier1-f01-f05-ghost.ts';
import { registerTier1TournamentTests } from './e2e/tier1-features/tier1-f06-f10-tournament.ts';
import { registerTier1TelemetryTrialsTests } from './e2e/tier1-features/tier1-f11-f16-telemetry-trials.ts';

// Tier 2: Boundary & Corner Cases (80 tests)
import { registerTier2GhostBoundaryTests } from './e2e/tier2-boundary/tier2-f01-f05-ghost-boundary.ts';
import { registerTier2TournamentBoundaryTests } from './e2e/tier2-boundary/tier2-f06-f10-tournament-boundary.ts';
import { registerTier2TelemetryTrialsBoundaryTests } from './e2e/tier2-boundary/tier2-f11-f16-telemetry-trials-boundary.ts';

// Tier 3: Pairwise Cross-Feature Interactions (16 tests)
import { registerTier3CrossFeatureTests } from './e2e/tier3-cross-feature/tier3-pairwise-interactions.ts';

// Tier 4: Real-World Application Scenarios (5 scenarios)
import { registerTier4ScenarioTests } from './e2e/tier4-scenarios/tier4-real-world-scenarios.ts';

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('⚡ SPEEDTYPE COMPREHENSIVE AUTOMATED TEST SUITE (TIERS 1 - 4) ⚡');
  console.log('================================================================\n');

  resetSuites();

  console.log('Loading test registrations...');
  // Tier 1 (80 tests)
  registerTier1GhostTests();
  registerTier1TournamentTests();
  registerTier1TelemetryTrialsTests();

  // Tier 2 (80 tests)
  registerTier2GhostBoundaryTests();
  registerTier2TournamentBoundaryTests();
  registerTier2TelemetryTrialsBoundaryTests();

  // Tier 3 (16 tests)
  registerTier3CrossFeatureTests();

  // Tier 4 (5 tests)
  registerTier4ScenarioTests();

  console.log('Executing test harness...\n');
  const summary = await runAllRegisteredSuites(true);

  console.log('\n================================================================');
  console.log('                    TEST EXECUTION RECEIPT                      ');
  console.log('================================================================');
  console.log(`Total Test Assertions:  ${summary.totalTests}`);
  console.log(`Passed Test Cases:      ${summary.passedTests} ✓`);
  console.log(`Failed Test Cases:      ${summary.failedTests} ${summary.failedTests > 0 ? '✗' : ''}`);
  console.log(`Total Execution Time:   ${summary.durationMs}ms`);
  console.log('================================================================\n');

  if (summary.failedTests > 0) {
    console.error(`💥 TEST SUITE FAILED with ${summary.failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log('🎉 ALL TIERS PASSED WITH ZERO REGRESSIONS!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
