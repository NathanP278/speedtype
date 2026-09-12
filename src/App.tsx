import { useState, useCallback } from 'react';
import { TerminalViewport } from './components/TerminalViewport.tsx';
import { ModernDuelArena } from './components/ModernDuelArena.tsx';
import { ModernResultModal } from './components/ModernResultModal.tsx';
import { TypingTest } from './components/TypingTest.tsx';
import { MenuModal } from './components/MenuModal.tsx';
import { BlackMarketModal } from './components/BlackMarketModal.tsx';
import { RivalryDossierModal } from './components/RivalryDossierModal.tsx';
import { TournamentLounge } from './components/TournamentLounge.tsx';
import { WeeklyTrialModal } from './components/WeeklyTrialModal.tsx';
import { GhostDuelSelector } from './components/GhostDuelSelector.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LeaderboardModal } from './components/LeaderboardModal.tsx';
import { ChallengeModal } from './components/ChallengeModal.tsx';
import { ChallengeGhostRunner } from './social/challengeCode.ts';
import { useAuth } from './auth/useAuth.ts';
import { submitScore } from './services/leaderboardService.ts';
import { useEconomy } from './economy/useEconomy.ts';
import { loadDossier, recordMatchInDossier, DossierData } from './social/rivalryDossier.ts';
import {
  GhostRunData,
  savePersonalBest,
  getPersonalBest,
  saveLastRun,
  getLastRun,
} from './social/ghostRecorder.ts';
import {
  UserCalibration,
  getStoredCalibration,
} from './engine/calibration.ts';
import { RivalDifficultyLevel } from './engine/adaptiveRival.ts';
import { useSimpleDuel } from './engine/useSimpleDuel.ts';
import { WeeklyTrial } from './trials/weeklyTrials.ts';
import { rateLimitCheck } from './utils/rateLimiter.ts';

export function App() {
  // Authentication & Account Gate
  const auth = useAuth();

  // Player Benchmark Calibration
  const [calibration, setCalibration] = useState<UserCalibration | null>(() => getStoredCalibration());
  const [isCalibrating, setIsCalibrating] = useState<boolean>(() => !getStoredCalibration());
  const [difficulty, setDifficulty] = useState<RivalDifficultyLevel>('equal');

  // Display toggles
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(false);

  // Economy & Meta Dossier
  const economy = useEconomy();
  const [dossier, setDossier] = useState<DossierData>(() => loadDossier());

  // Menu & Subsystem Modals
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [marketOpen, setMarketOpen] = useState<boolean>(false);
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);
  const [tournamentOpen, setTournamentOpen] = useState<boolean>(false);
  const [trialsOpen, setTrialsOpen] = useState<boolean>(false);
  const [ghostOpen, setGhostOpen] = useState<boolean>(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [challengeOpen, setChallengeOpen] = useState<boolean>(false);

  // Ghost runs
  const [lastPlayerGhost, setLastPlayerGhost] = useState<GhostRunData | null>(() => getLastRun());
  const [personalBestGhost, setPersonalBestGhost] = useState<GhostRunData | null>(() => getPersonalBest());
  const [activeTrial, setActiveTrial] = useState<WeeklyTrial | null>(null);

  const isAnyModalOpen =
    menuOpen ||
    marketOpen ||
    dossierOpen ||
    tournamentOpen ||
    trialsOpen ||
    ghostOpen ||
    leaderboardOpen ||
    challengeOpen;

  // Pure 1v1 Adaptive Duel Engine
  const duel = useSimpleDuel({
    calibration,
    difficulty,
    enabled: !isCalibrating && !isAnyModalOpen,
  });

  // Handle benchmark calibration completion
  const handleCalibrationComplete = (newCal: UserCalibration) => {
    if (!rateLimitCheck('calibration_complete')) {
      console.warn('[RateLimit] calibration_complete blocked');
    }
    setCalibration(newCal);
    setIsCalibrating(false);
    duel.resetDuel();
  };

  // When match completes, award KP & record dossier
  const handleDuelResultRecorded = useCallback(
    (isWin: boolean, playerWpm: number) => {
      if (!rateLimitCheck('kp_award')) {
        console.warn('[RateLimit] kp_award blocked — too many completions');
        return;
      }
      const earnedKp = isWin ? Math.round(playerWpm * 1.5) : Math.round(playerWpm * 0.5);
      economy.awardKp(earnedKp);

      // Submit to cloud/local leaderboard service if user is authenticated
      if (auth.user) {
        submitScore(auth.user, playerWpm, duel.playerStats.accuracy, difficulty);
      }

      setDossier((prev) =>
        recordMatchInDossier(
          prev,
          duel.rivalStats.name,
          isWin,
          playerWpm,
          earnedKp,
          [],
          undefined
        )
      );

      const freshLastRun = getLastRun();
      setLastPlayerGhost(freshLastRun);
      const freshPb = getPersonalBest();
      setPersonalBestGhost(freshPb);
    },
    [duel.rivalStats.name, economy, auth.user, difficulty, duel.playerStats.accuracy]
  );

  const handleAcceptChallenge = useCallback(
    (ghost: ChallengeGhostRunner) => {
      duel.startCustomMatch(
        ghost.wordsList,
        ghost.netWpm,
        `CHALLENGER // ${ghost.challengerAvatar} ${ghost.challengerName}`
      );
      setChallengeOpen(false);
    },
    [duel]
  );

  const onOpenChallengeFromDuel = useCallback(() => {
    // Record the result before leaving so ghost is updated in dossier, kp, and leaderboard.
    if (duel.duelResult) {
      handleDuelResultRecorded(duel.duelResult.winner === 'player', duel.duelResult.playerWpm);
    }
    const freshLastRun = getLastRun();
    setLastPlayerGhost(freshLastRun);
    duel.resetDuel();
    setChallengeOpen(true);
  }, [duel, handleDuelResultRecorded]);

  // ── Authentication & Onboarding Gate ──────────────────────────────────────
  if (!auth.user || !auth.user.onboardingComplete) {
    return (
      <AuthModal
        currentUser={auth.user}
        onSignInWithGoogle={auth.signInWithGoogle}
        onUpdateProfile={auth.updateProfile}
        isLoading={auth.isLoading}
        serverError={auth.error}
        isCloudEnabled={auth.isCloudEnabled}
      />
    );
  }

  return (
    <TerminalViewport
      kpBalance={economy.balance}
      currentPaletteId={economy.equipped.palette}
      currentWpm={duel.playerStats.wpm}
      playerProfile={{ username: auth.user.username, avatar: auth.user.avatar }}
      currentUser={auth.user}
      onSignOut={auth.signOut}
      onSelectPalette={(id) => economy.equipItem('palette', id)}
      onOpenMenu={() => setMenuOpen(true)}
      onRetest={() => setIsCalibrating(true)}
      crtEnabled={crtEnabled}
      scanlinesEnabled={scanlinesEnabled}
      calibrationBadge={
        calibration ? (
          <button
            type="button"
            onClick={() => setIsCalibrating(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-full text-xs transition-all shadow-sm cursor-pointer active:scale-95"
            title="Click to recalibrate your typing benchmark"
          >
            <span className="text-amber-400 font-bold">⚡</span>
            <span className="text-zinc-300">
              Benchmark: <strong className="text-white">{calibration.netWpm} WPM</strong>
            </span>
            <span className="text-zinc-500 text-[10px]">({calibration.accuracy}% Acc)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCalibrating(true)}
            className="px-3.5 py-1.5 bg-amber-950/60 border border-amber-500/80 text-amber-300 rounded-full text-xs font-bold animate-pulse shadow-sm"
          >
            ⚡ Take Calibration Benchmark
          </button>
        )
      }
    >
      {/* VIEW MODE 1: INTRODUCTION / CALIBRATION BENCHMARK */}
      {isCalibrating ? (
        <TypingTest
          existingCalibration={calibration}
          onComplete={handleCalibrationComplete}
          onCancel={calibration ? () => setIsCalibrating(false) : undefined}
        />
      ) : (
        /* VIEW MODE 2: SIMPLIFIED 1v1 RIVAL DUEL */
        <ModernDuelArena
          playerStats={duel.playerStats}
          rivalStats={duel.rivalStats}
          currentWordText={duel.currentWordText}
          typedIndex={duel.typedIndex}
          upcomingWords={duel.upcomingWords}
          difficulty={difficulty}
          gameStarted={duel.gameStarted}
          onResetMatch={duel.resetDuel}
          onRetestSpeed={() => setIsCalibrating(true)}
        />
      )}

      {/* Modern Match Result Modal */}
      <ModernResultModal
        result={duel.duelResult}
        onRematch={() => {
          if (duel.duelResult) {
            handleDuelResultRecorded(duel.duelResult.winner === 'player', duel.duelResult.playerWpm);
          }
          duel.resetDuel();
        }}
        onSelectDifficulty={(newDiff) => {
          setDifficulty(newDiff);
          duel.resetDuel();
        }}
        onRetest={() => setIsCalibrating(true)}
        onOpenChallenge={onOpenChallengeFromDuel}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
      />

      {/* Clean Menu Modal (Extras & Archives) */}
      <MenuModal
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenTournament={() => setTournamentOpen(true)}
        onOpenGhost={() => setGhostOpen(true)}
        onOpenDossier={() => setDossierOpen(true)}
        onOpenTrials={() => setTrialsOpen(true)}
        onOpenMarket={() => setMarketOpen(true)}
        onOpenLeaderboard={() => { setMenuOpen(false); setLeaderboardOpen(true); }}
        onOpenChallenge={() => { setMenuOpen(false); setChallengeOpen(true); }}
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => setScanlinesEnabled(!scanlinesEnabled)}
        kpBalance={economy.balance}
      />

      {/* Secondary Meta Subsystem Modals */}
      <BlackMarketModal
        isOpen={marketOpen}
        onClose={() => setMarketOpen(false)}
        balance={economy.balance}
        unlockedItemIds={economy.unlockedItemIds}
        equipped={economy.equipped}
        onBuy={economy.buyItem}
        onEquip={economy.equipItem}
      />

      <RivalryDossierModal
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        dossier={dossier}
      />

      <TournamentLounge
        isOpen={tournamentOpen}
        onClose={() => setTournamentOpen(false)}
        playerKp={economy.balance}
        onUpdateKp={(delta) => economy.awardKp(delta)}
      />

      <WeeklyTrialModal
        isOpen={trialsOpen}
        onClose={() => setTrialsOpen(false)}
        activeModifier={activeTrial?.id}
        onSelectTrial={(trial) => setActiveTrial(trial)}
      />

      <GhostDuelSelector
        isOpen={ghostOpen}
        onClose={() => setGhostOpen(false)}
        lastPlayerRun={lastPlayerGhost}
        personalBestRun={personalBestGhost}
        onSelectGhost={(ghost) => {
          setLastPlayerGhost(ghost);
          saveLastRun(ghost);
          const pb = getPersonalBest();
          if (!pb || ghost.wpm > pb.wpm) {
            setPersonalBestGhost(ghost);
            savePersonalBest(ghost);
          }
        }}
      />

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        username={auth.user.username}
      />

      <ChallengeModal
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        playerProfile={{ username: auth.user.username, avatar: auth.user.avatar }}
        lastRun={lastPlayerGhost}
        onAcceptChallenge={handleAcceptChallenge}
      />
    </TerminalViewport>
  );
}

export default App;
