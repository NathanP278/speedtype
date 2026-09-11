import React, { useMemo } from 'react';
import { loadLeaderboard, getPlayerBestEntry, LeaderboardEntry } from '../profile/leaderboard.ts';

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

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  const allEntries = useMemo(() => loadLeaderboard(), [isOpen]);
  const top20 = allEntries.slice(0, 20);
  const playerBest = getPlayerBestEntry(username);
  const playerRankInTop20 = top20.findIndex((e) => e.username === username);
  const playerIsInTop20 = playerRankInTop20 !== -1;
  const playerGlobalRank = allEntries.findIndex((e) => e.username === username) + 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-black text-white tracking-widest">
              ⚡ TOP TYPISTS // LOCAL LEADERBOARD
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Tracking all sessions on this device</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors"
          >
            [CLOSE]
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {allEntries.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              <div className="text-3xl mb-3">📊</div>
              No runs recorded yet. Complete a duel to get on the board.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3 text-left w-10">#</th>
                  <th className="py-2 px-3 text-left">Fighter</th>
                  <th className="py-2 px-3 text-right">Net WPM</th>
                  <th className="py-2 px-3 text-right">Acc</th>
                  <th className="py-2 px-3 text-right hidden sm:table-cell">Mode</th>
                  <th className="py-2 px-3 text-right hidden md:table-cell">Date</th>
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

                {/* If player not in top 20, show separator + their best */}
                {!playerIsInTop20 && playerBest && (
                  <>
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-center text-zinc-700 text-[10px]">
                        · · · · ·
                      </td>
                    </tr>
                    <LeaderboardRow
                      rank={playerGlobalRank || allEntries.length}
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
        <div className="px-6 py-3 border-t border-zinc-900 text-[10px] text-zinc-600 flex items-center justify-between">
          <span>Showing top {Math.min(20, allEntries.length)} of {allEntries.length} entries</span>
          {playerGlobalRank > 0 && (
            <span className="text-[var(--theme-text)] font-bold">
              Your rank: #{playerGlobalRank}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardRow: React.FC<{
  rank: number;
  entry: LeaderboardEntry;
  isMe: boolean;
}> = ({ rank, entry, isMe }) => {
  const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
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
        <span className="mr-1.5">{entry.avatar}</span>
        <span className={`font-bold ${isMe ? 'text-[var(--theme-text)]' : 'text-zinc-200'}`}>
          {entry.username}
        </span>
        {isMe && <span className="ml-1.5 text-[9px] text-zinc-500">(you)</span>}
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
