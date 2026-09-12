import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { UserAccount } from '../auth/authTypes.ts';
import { rateLimitCheck } from '../utils/rateLimiter.ts';

export interface LeaderboardRecord {
  id: string;
  userId?: string;
  username: string;
  avatar: string;
  provider: 'google' | 'email' | 'local';
  netWpm: number;
  accuracy: number;
  difficulty: string;
  createdAt: number;
}

const LOCAL_STORAGE_KEY = 'speedtype_cloud_leaderboard_cache';
const MAX_LOCAL_ENTRIES = 100;

function getLocalRecords(): LeaderboardRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: LeaderboardRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records.slice(0, MAX_LOCAL_ENTRIES)));
  } catch (err) {
    console.error('[LeaderboardService] Failed to save local cache', err);
  }
}

/**
 * Fetches top leaderboard records.
 * Queries Supabase `leaderboard` table if configured; otherwise reads local cache.
 */
export async function fetchLeaderboard(
  difficultyFilter?: string,
  limit: number = 50
): Promise<{ data: LeaderboardRecord[]; isCloud: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('leaderboard')
        .select('id, user_id, username, avatar, provider, net_wpm, accuracy, difficulty, created_at')
        .order('net_wpm', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (difficultyFilter && difficultyFilter !== 'all') {
        query = query.eq('difficulty', difficultyFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[LeaderboardService] Supabase query error, falling back to cache:', error.message);
        return { data: filterLocal(difficultyFilter, limit), isCloud: false, error: error.message };
      }

      const records: LeaderboardRecord[] = (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        avatar: row.avatar || '⚡',
        provider: (row.provider as 'google' | 'email') || 'email',
        netWpm: row.net_wpm,
        accuracy: Number(row.accuracy),
        difficulty: row.difficulty,
        createdAt: new Date(row.created_at).getTime(),
      }));

      // Update local cache with top cloud entries
      if (!difficultyFilter || difficultyFilter === 'all') {
        saveLocalRecords(records);
      }

      return { data: records, isCloud: true };
    } catch (err) {
      console.warn('[LeaderboardService] Network error, fallback to local', err);
      return { data: filterLocal(difficultyFilter, limit), isCloud: false };
    }
  }

  // Supabase not configured: return local records
  return { data: filterLocal(difficultyFilter, limit), isCloud: false };
}

function filterLocal(difficultyFilter?: string, limit: number = 50): LeaderboardRecord[] {
  let list = getLocalRecords();
  if (difficultyFilter && difficultyFilter !== 'all') {
    list = list.filter((r) => r.difficulty === difficultyFilter);
  }
  return list.sort((a, b) => b.netWpm - a.netWpm).slice(0, limit);
}

/**
 * Submits a new match score to the leaderboard.
 * Rate-limited to prevent automated spamming.
 */
export async function submitScore(
  user: UserAccount,
  netWpm: number,
  accuracy: number,
  difficulty: string
): Promise<{ success: boolean; error?: string }> {
  if (!rateLimitCheck('leaderboard_submit')) {
    return { success: false, error: 'Rate limit exceeded. Please wait a moment.' };
  }

  if (netWpm < 1 || netWpm > 350) {
    return { success: false, error: 'WPM out of verified range' };
  }
  if (accuracy < 0 || accuracy > 100) {
    return { success: false, error: 'Accuracy out of verified range' };
  }

  const localRecord: LeaderboardRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    provider: user.provider,
    netWpm: Math.round(netWpm),
    accuracy: Math.round(accuracy * 10) / 10,
    difficulty,
    createdAt: Date.now(),
  };

  // Always update local cache so user immediately sees their score
  const localList = getLocalRecords();
  localList.push(localRecord);
  localList.sort((a, b) => b.netWpm - a.netWpm);
  saveLocalRecords(localList);

  window.dispatchEvent(new CustomEvent('speedtype:score-submitted', { detail: localRecord }));

  // Submit to Supabase if configured and user is authenticated
  if (isSupabaseConfigured && supabase && user.id && !user.id.startsWith('local-')) {
    try {
      const { error } = await supabase.from('leaderboard').insert({
        user_id: user.id,
        username: user.username,
        avatar: user.avatar,
        provider: user.provider,
        net_wpm: Math.round(netWpm),
        accuracy: Math.round(accuracy * 10) / 10,
        difficulty,
      });

      if (error) {
        console.error('[LeaderboardService] Supabase score insert error:', error.message);
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error('[LeaderboardService] Failed to insert cloud score', err);
      return { success: false, error: 'Network error submitting score to cloud.' };
    }
  }

  return { success: true };
}

export function subscribeToLeaderboardLive(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('speedtype:score-submitted', handler);
  let channel: any = null;
  if (isSupabaseConfigured && supabase) {
    channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'leaderboard' }, () => callback())
      .subscribe();
  }
  return () => {
    window.removeEventListener('speedtype:score-submitted', handler);
    if (channel) supabase.removeChannel(channel);
  };
}
