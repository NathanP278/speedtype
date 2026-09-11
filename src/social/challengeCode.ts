import { rateLimitCheck } from '../utils/rateLimiter.ts';

export interface ChallengePayload {
  v: 1;
  challenger: string;         // username
  avatar: string;             // emoji avatar
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  wordsList: string[];        // the exact word list (max 20 words)
  wordTimestampsMs: number[]; // ms from race-start when each word was completed
  createdAt: number;
}

const MAX_PAYLOAD_BYTES = 6144; // ~6 KB safety cap

/**
 * Encodes a ChallengePayload to a URL-safe base64 string.
 */
export function encodeChallengeCode(payload: ChallengePayload): string {
  const json = JSON.stringify(payload);
  // encodeURIComponent handles non-ASCII before btoa
  return btoa(encodeURIComponent(json));
}

/**
 * Decodes and validates a challenge code string.
 * Returns null for any invalid/tampered/oversize input — never throws.
 * Rate-limited to prevent brute-force scanning.
 */
export function decodeChallengeCode(code: string): ChallengePayload | null {
  if (!rateLimitCheck('challenge_decode')) {
    console.warn('[RateLimit] challenge_decode blocked');
    return null;
  }

  try {
    const trimmed = code.trim();
    if (!trimmed) return null;

    const json = decodeURIComponent(atob(trimmed));
    if (json.length > MAX_PAYLOAD_BYTES) return null;

    const parsed = JSON.parse(json) as ChallengePayload;

    // Structural validation
    if (
      parsed.v !== 1 ||
      typeof parsed.challenger !== 'string' ||
      parsed.challenger.length < 1 ||
      parsed.challenger.length > 50 ||
      typeof parsed.avatar !== 'string' ||
      typeof parsed.netWpm !== 'number' ||
      typeof parsed.grossWpm !== 'number' ||
      typeof parsed.accuracy !== 'number' ||
      !Array.isArray(parsed.wordsList) ||
      !Array.isArray(parsed.wordTimestampsMs) ||
      parsed.wordsList.length === 0 ||
      parsed.wordsList.length > 25 ||
      parsed.wordsList.length !== parsed.wordTimestampsMs.length ||
      typeof parsed.createdAt !== 'number'
    ) {
      return null;
    }

    // Sanity: reject physically impossible stats
    if (parsed.netWpm < 1 || parsed.netWpm > 300) return null;
    if (parsed.accuracy < 0 || parsed.accuracy > 100) return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Builds a ghost runner descriptor from a decoded challenge payload.
 * Used to set up the duel against the challenger's ghost.
 */
export interface ChallengeGhostRunner {
  wordsList: string[];
  wordTimestampsMs: number[];
  challengerName: string;
  challengerAvatar: string;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
}

export function buildChallengeGhostRunner(payload: ChallengePayload): ChallengeGhostRunner {
  return {
    wordsList: payload.wordsList,
    wordTimestampsMs: payload.wordTimestampsMs,
    challengerName: payload.challenger,
    challengerAvatar: payload.avatar,
    netWpm: payload.netWpm,
    grossWpm: payload.grossWpm,
    accuracy: payload.accuracy,
  };
}
