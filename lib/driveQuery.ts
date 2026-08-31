/** Pure helpers for the Drive layer. Kept separate so they're testable. */

/**
 * Escape a value for interpolation into a Drive API `q` search string.
 * Album names come from user input, so an unescaped quote would break the
 * query (or smuggle in extra clauses).
 */
export function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Treat a token as stale a minute early so it can't expire mid-request. */
export const TOKEN_SKEW_MS = 60_000;

export function isTokenFresh(expiresAt: number, now: number): boolean {
  return now < expiresAt - TOKEN_SKEW_MS;
}
