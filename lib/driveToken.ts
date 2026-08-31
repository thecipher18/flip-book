"use client";

import { isTokenFresh } from "./driveQuery";

const SCOPE = "https://www.googleapis.com/auth/drive.file email profile";

let client: google.accounts.oauth2.TokenClient | null = null;
let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string> | null = null;
let resolver: {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
} | null = null;

function settle(fn: (r: NonNullable<typeof resolver>) => void) {
  const r = resolver;
  resolver = null;
  if (r) fn(r);
}

function ensureClient(): google.accounts.oauth2.TokenClient {
  if (client) return client;

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");

  // initTokenClient fixes its callback at construction, so requests are
  // dispatched through the module-level `resolver`.
  client = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (resp) => {
      if (resp.error || !resp.access_token) {
        settle((r) => r.reject(new Error(resp.error ?? "no access token")));
        return;
      }
      cached = {
        token: resp.access_token,
        expiresAt: Date.now() + Number(resp.expires_in) * 1000,
      };
      settle((r) => r.resolve(resp.access_token));
    },
    // Without this a blocked or dismissed popup never settles the promise.
    error_callback: (err) => {
      settle((r) => r.reject(new Error(err.type ?? "token request failed")));
    },
  });
  return client;
}

export function cachedToken(): string | null {
  if (cached && isTokenFresh(cached.expiresAt, Date.now())) return cached.token;
  return null;
}

/**
 * Get a Drive access token.
 *
 * `interactive: false` asks Google for a silent re-grant — works when the user
 * has already consented and still has a live Google session, which is the
 * normal case on reload. It fails rather than prompting.
 *
 * `interactive: true` opens the consent popup and so MUST be called from a user
 * gesture, or the browser blocks it.
 */
export function requestToken(interactive: boolean): Promise<string> {
  const hit = cachedToken();
  if (hit) return Promise.resolve(hit);
  if (pending) return pending;

  const p = new Promise<string>((resolve, reject) => {
    resolver = { resolve, reject };
    ensureClient().requestAccessToken(interactive ? {} : { prompt: "" });
  }).finally(() => {
    if (pending === p) pending = null;
  });

  pending = p;
  return p;
}

export function clearToken() {
  cached = null;
}

/**
 * GIS loads from a <Script> tag, so the first caller after hydration may beat
 * it. ponytail: poll, rather than thread a load callback through the tree.
 */
export function waitForGis(timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Google Identity Services failed to load"));
      }
    }, 50);
  });
}
