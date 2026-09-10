import { runAllRegisteredSuites } from './test-harness.ts';
import { registerTier1GhostTests } from './e2e/tier1-features/tier1-f01-f05-ghost.ts';
import { registerTier1TournamentTests } from './e2e/tier1-features/tier1-f06-f10-tournament.ts';
import { registerTier1TelemetryTrialsTests } from './e2e/tier1-features/tier1-f11-f16-telemetry-trials.ts';

async function main() {
  console.log('Registering Tier 1 suites...');
  registerTier1GhostTests();
  registerTier1TournamentTests();
  registerTier1TelemetryTrialsTests();

  const summary = await runAllRegisteredSuites(true);
  console.log('\n========================================');
  console.log(`Tier 1 Total: ${summary.totalTests} | Passed: ${summary.passedTests} | Failed: ${summary.failedTests} | Duration: ${summary.durationMs}ms`);
  console.log('========================================');

  if (summary.failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
