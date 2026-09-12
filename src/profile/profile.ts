export const AVATAR_OPTIONS = ['⚡', '🔥', '💀', '🤖', '👾', '🎯', '🌀', '⚔️', '🛸', '🦾'];

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
