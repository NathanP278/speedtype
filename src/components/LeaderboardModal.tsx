import React, { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard, LeaderboardRecord, subscribeToLeaderboardLive } from '../services/leaderboardService.ts';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  relaxed: 'WARMUP',
  equal: 'EVEN',
  challenger: 'CHLG',
  boss: 'BOSS',
};

const DIFFICULTY_FILTERS = [
  { id: 'all', label: 'ALL MODES' },
  { id: 'relaxed', label: 'WARMUP' },
  { id: 'equal', label: 'EVEN' },
  { id: 'challenger', label: 'CHLG' },
  { id: 'boss', label: 'BOSS' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const res = await fetchLeaderboard(selectedDifficulty, 50);
      setRecords(res.data);
      setIsCloud(res.isCloud);
    } catch (err) {
      console.error('[LeaderboardModal] Error fetching records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, selectedDifficulty, refreshTrigger]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isOpen) {
      return subscribeToLeaderboardLive(() => loadData());
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const top20 = records.slice(0, 20);
  const playerRankInTop20 = top20.findIndex((e) => e.username === username);
  const playerIsInTop20 = playerRankInTop20 !== -1;
  const playerBest = records.find((e) => e.username === username);
  const playerGlobalRank = playerBest ? records.findIndex((e) => e.id === playerBest.id) + 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono animate-fadeIn">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-zinc-800/80 gap-3 bg-zinc-900/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-widest flex items-center gap-2">
                <span>⚡ SPEEDTYPE</span>
                <span className="text-zinc-600">//</span>
                <span className="text-[var(--theme-text)]">HALL OF FIGHTERS</span>
              </h2>
              {isCloud ? (
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded font-bold tracking-wider">
                  CLOUD SYNC
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-bold tracking-wider">
                  LOCAL DISK
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Verified global records filtered by combat tier & account authority
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshTrigger((t) => t + 1)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-lg transition-colors focus-ring cursor-pointer disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              {isLoading ? 'SYNCING...' : '↻ REFRESH'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors focus-ring cursor-pointer"
            >
              [CLOSE]
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/60 bg-zinc-950/70 overflow-x-auto text-xs">
          <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">DIFFICULTY:</span>
          {DIFFICULTY_FILTERS.map((f) => {
            const active = selectedDifficulty === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedDifficulty(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors focus-ring whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[var(--theme-text)] text-black font-black'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Table Area */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          {isLoading && records.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 text-sm">
              <div className="animate-spin text-2xl mb-2">⚡</div>
              Fetching pilot dossier rankings...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 text-sm">
              <div className="text-3xl mb-3">📊</div>
              No match runs recorded under this filter yet. Win a duel to claim rank #1.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-900">
                  <th className="py-2 px-3 text-left w-12">#</th>
                  <th className="py-2 px-3 text-left">Pilot / Account</th>
                  <th className="py-2 px-3 text-right">Net WPM</th>
                  <th className="py-2 px-3 text-right">Accuracy</th>
                  <th className="py-2 px-3 text-right hidden sm:table-cell">Combat Mode</th>
                  <th className="py-2 px-3 text-right hidden md:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((entry, idx) => {
                  const isMe = entry.username === username;
                  return (
                    <LeaderboardRow
                      key={entry.id}
                      rank={idx + 1}
                      entry={entry}
                      isMe={isMe}
                    />
                  );
                })}

                {/* If player not in top 20, show separator + their best recorded score */}
                {!playerIsInTop20 && playerBest && (
                  <>
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-center text-zinc-700 text-[10px]">
                        · · · · ·
                      </td>
                    </tr>
                    <LeaderboardRow
                      rank={playerGlobalRank || records.length}
                      entry={playerBest}
                      isMe={true}
                    />
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-900 bg-zinc-950 text-[11px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span>Showing top {Math.min(20, records.length)} of {records.length} records</span>
            <span className="hidden sm:inline text-zinc-700">|</span>
            <span className="hidden sm:flex items-center gap-2">
              <span className="text-[9px] px-1 bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded font-bold">G</span>
              <span className="text-zinc-600">= Google</span>
              <span className="text-[9px] px-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-bold">✉</span>
              <span className="text-zinc-600">= Email</span>
            </span>
          </span>
          {playerGlobalRank > 0 ? (
            <span className="text-[var(--theme-text)] font-bold">
              Your rank: #{playerGlobalRank}
            </span>
          ) : (
            <span className="text-zinc-600">Unranked in this filter</span>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardRow: React.FC<{
  rank: number;
  entry: LeaderboardRecord;
  isMe: boolean;
}> = ({ rank, entry, isMe }) => {
  const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <tr
      className={`border-l-2 transition-colors ${
        isMe
          ? 'border-[var(--theme-text)] bg-[var(--theme-dim)]/10'
          : 'border-transparent hover:bg-zinc-900/40'
      }`}
    >
      <td className={`py-2.5 px-3 font-bold ${rank <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">{entry.avatar}</span>
          <span className={`font-bold ${isMe ? 'text-[var(--theme-text)]' : 'text-zinc-200'}`}>
            {entry.username}
          </span>
          {/* Provider Badge */}
          {entry.provider === 'google' ? (
            <span
              className="text-[9px] px-1 bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded font-bold"
              title="Verified Google Account"
            >
              G
            </span>
          ) : (
            <span
              className="text-[9px] px-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-bold"
              title="Verified Email Account"
            >
              ✉
            </span>
          )}
          {isMe && <span className="text-[9px] text-zinc-500 font-normal">(you)</span>}
        </div>
      </td>
      <td className="py-2.5 px-3 text-right font-black text-[var(--theme-text)]">
        {entry.netWpm}
      </td>
      <td className="py-2.5 px-3 text-right text-cyan-400">{entry.accuracy}%</td>
      <td className="py-2.5 px-3 text-right text-zinc-500 hidden sm:table-cell">
        {DIFFICULTY_LABELS[entry.difficulty] ?? entry.difficulty}
      </td>
      <td className="py-2.5 px-3 text-right text-zinc-600 hidden md:table-cell">{date}</td>
    </tr>
  );
};
