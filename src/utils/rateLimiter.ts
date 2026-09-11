/**
 * In-memory token-bucket rate limiter.
 * Buckets live only for the session — state resets on page reload.
 * This prevents client-side abuse (KP farming, leaderboard spam, challenge brute-force).
 */

interface BucketConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
}

interface Bucket {
  tokens: number;
  lastRefillTime: number; // ms timestamp
}

const CONFIGS: Record<string, BucketConfig> = {
  kp_award:             { maxTokens: 10, refillRate: 10 / 60 },  // 10 per 60s
  leaderboard_submit:   { maxTokens: 5,  refillRate: 5 / 60 },   // 5 per 60s
  profile_save:         { maxTokens: 3,  refillRate: 3 / 120 },  // 3 per 120s
  challenge_decode:     { maxTokens: 20, refillRate: 20 / 60 },  // 20 per 60s
  calibration_complete: { maxTokens: 3,  refillRate: 3 / 120 },  // 3 per 120s
};

const buckets = new Map<string, Bucket>();

function getOrCreateBucket(key: string, config: BucketConfig): Bucket {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    const b: Bucket = { tokens: config.maxTokens, lastRefillTime: now };
    buckets.set(key, b);
    return b;
  }

  // Refill based on elapsed time
  const elapsedSec = (now - existing.lastRefillTime) / 1000;
  const refilled = Math.min(config.maxTokens, existing.tokens + elapsedSec * config.refillRate);
  existing.tokens = refilled;
  existing.lastRefillTime = now;
  return existing;
}

/**
 * Attempts to consume one token from the bucket for the given action key.
 * Returns true if the action is allowed, false if rate-limited.
 * Unknown keys are always allowed (fail-open for unconfigured actions).
 */
export function rateLimitCheck(key: string): boolean {
  const config = CONFIGS[key];
  if (!config) return true; // unknown key → allow

  const bucket = getOrCreateBucket(key, config);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true; // allowed
  }
  return false; // rate-limited
}

/**
 * Returns a human-friendly message for when an action is rate-limited.
 */
export function getRateLimitMessage(key: string): string {
  return `Action '${key}' temporarily limited. Please wait a moment before trying again.`;
}

/**
 * Peek at remaining tokens without consuming (for debugging / display).
 */
export function getRemainingTokens(key: string): number {
  const config = CONFIGS[key];
  if (!config) return Infinity;
  const bucket = getOrCreateBucket(key, config);
  return Math.floor(bucket.tokens);
}
