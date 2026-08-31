// Server-only. Identifies the caller of an API route from their Google access
// token, and decides whether they may write.
import { isWriter } from "./driveQuery";

const TOKENINFO = "https://oauth2.googleapis.com/tokeninfo";

export interface Caller {
  email: string;
  canWrite: boolean;
}

// ponytail: process-memory cache, so a page full of photos costs one tokeninfo
// call, not one per image. Entries expire with the token they describe.
const verified = new Map<string, { caller: Caller; expiresAt: number }>();

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Verify a Google access token and return who it belongs to, or null.
 *
 * `aud` must match this app's client ID: a valid Google token minted for some
 * *other* app must not be usable here, or anyone could mint a token for an
 * allowlisted address elsewhere and write to the library with it.
 */
export async function getCaller(req: Request): Promise<Caller | null> {
  const token = bearer(req);
  if (!token) return null;

  const hit = verified.get(token);
  if (hit && hit.expiresAt > Date.now()) return hit.caller;

  const res = await fetch(`${TOKENINFO}?access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return null;
  const info = await res.json();

  if (info.aud !== process.env.GOOGLE_CLIENT_ID) return null;
  if (info.email_verified !== "true" && info.email_verified !== true) return null;
  if (!info.email) return null;

  const caller: Caller = {
    email: info.email,
    canWrite: isWriter(info.email, process.env.WRITER_EMAILS),
  };
  // Never cache past the token's own expiry, capped at 5 minutes so an allowlist
  // change takes effect promptly.
  const ttl = Math.min(Number(info.expires_in ?? 0) * 1000, 5 * 60_000);
  if (ttl > 0) verified.set(token, { caller, expiresAt: Date.now() + ttl });
  return caller;
}

export function unauthorized(): Response {
  return Response.json({ error: "Sign in required" }, { status: 401 });
}

export function forbidden(): Response {
  return Response.json({ error: "Read-only access" }, { status: 403 });
}

/** Wrap a handler so it only runs for a signed-in caller. */
export function withCaller<T extends unknown[]>(
  handler: (caller: Caller, req: Request, ...rest: T) => Promise<Response>,
  opts: { write?: boolean } = {},
) {
  return async (req: Request, ...rest: T): Promise<Response> => {
    const caller = await getCaller(req);
    if (!caller) return unauthorized();
    if (opts.write && !caller.canWrite) return forbidden();
    try {
      return await handler(caller, req, ...rest);
    } catch (err) {
      // Logged, not returned: Drive error bodies can carry the owner's
      // account details, which readers have no business seeing.
      console.error(err);
      return Response.json({ error: "Request failed" }, { status: 500 });
    }
  };
}
