import { rateLimitCheck } from '../utils/rateLimiter.ts';

export interface PlayerProfile {
  username: string;   // 3-20 chars, /^[a-zA-Z0-9_]+$/
  avatar: string;     // one of AVATAR_OPTIONS
  createdAt: number;  // Date.now()
}

export const AVATAR_OPTIONS = ['⚡', '🔥', '💀', '🤖', '👾', '🎯', '🌀', '⚔️', '🛸', '🦾'];

const PROFILE_KEY = 'speedtype_profile';

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerProfile;
    if (
      typeof parsed.username === 'string' &&
      parsed.username.length >= 3 &&
      typeof parsed.avatar === 'string' &&
      typeof parsed.createdAt === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProfile(p: PlayerProfile): boolean {
  if (!rateLimitCheck('profile_save')) {
    console.warn('[RateLimit] profile_save blocked');
    return false;
  }
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    return true;
  } catch (err) {
    console.error('Failed to save profile', err);
    return false;
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (err) {
    console.error('Failed to clear profile', err);
  }
}

/**
 * Validates a candidate username.
 * Returns an error string if invalid, or null if valid.
 */
export function validateUsername(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'Too short (min 3 chars)';
  if (trimmed.length > 20) return 'Too long (max 20 chars)';
  // Reject HTML special chars (XSS hardening)
  if (/<|>|&|"|'|`/.test(trimmed)) return 'Username contains invalid characters';
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Letters, numbers, and underscores only';
  return null;
}
