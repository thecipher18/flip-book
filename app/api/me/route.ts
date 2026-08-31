import { getCaller, unauthorized } from "@/lib/apiAuth";

const USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

/** Who the caller is, plus whether the allowlist lets them upload. */
export async function GET(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return unauthorized();

  const res = await fetch(USERINFO, {
    headers: { Authorization: req.headers.get("authorization")! },
  });
  const profile = res.ok ? await res.json() : {};

  return Response.json({
    email: caller.email,
    name: profile.name ?? caller.email,
    picture: profile.picture ?? "",
    canWrite: caller.canWrite,
  });
}
