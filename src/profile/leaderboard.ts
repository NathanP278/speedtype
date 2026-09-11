import { rateLimitCheck } from '../utils/rateLimiter.ts';

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  netWpm: number;
  accuracy: number;
  difficulty: string;
  timestamp: number;
}

const LB_KEY = 'speedtype_leaderboard';
const MAX_ENTRIES = 100;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Submits a new leaderboard entry. Rate-limited to 5 per 60s.
 * Entries with impossible WPM or accuracy are rejected silently.
 * Returns the updated sorted leaderboard.
 */
export function submitLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'id'>
): LeaderboardEntry[] {
  if (!rateLimitCheck('leaderboard_submit')) {
    console.warn('[RateLimit] leaderboard_submit blocked');
    return loadLeaderboard();
  }

  // Sanity checks — reject physically impossible values
  if (entry.netWpm < 1 || entry.netWpm > 250) {
    console.warn('[Leaderboard] rejected entry: netWpm out of range', entry.netWpm);
    return loadLeaderboard();
  }
  if (entry.accuracy < 0 || entry.accuracy > 100) {
    console.warn('[Leaderboard] rejected entry: accuracy out of range', entry.accuracy);
    return loadLeaderboard();
  }

  const current = loadLeaderboard();
  const newEntry: LeaderboardEntry = { ...entry, id: generateId() };
  const updated = [...current, newEntry]
    .sort((a, b) => b.netWpm - a.netWpm)
    .slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(LB_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save leaderboard', err);
  }

  return updated;
}

/** Finds the single best entry for a username (highest netWpm). */
export function getPlayerBestEntry(username: string): LeaderboardEntry | null {
  const entries = loadLeaderboard().filter((e) => e.username === username);
  if (entries.length === 0) return null;
  return entries.reduce((best, e) => (e.netWpm > best.netWpm ? e : best));
}
