// One-time: mint the owner's Drive refresh token for GOOGLE_REFRESH_TOKEN.
//
//   npm run mint-token
//
// Sign in as the account that should HOLD the photo library. Requires
// http://localhost:53682 in the OAuth client's Authorized redirect URIs.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function env(name) {
  for (const file of [".env.local", ".env"]) {
    try {
      const line = readFileSync(file, "utf8")
        .split("\n")
        .find((l) => l.startsWith(`${name}=`));
      if (line) return line.slice(name.length + 1).trim();
    } catch {}
  }
  return process.env[name];
}

const clientId = env("GOOGLE_CLIENT_ID") || env("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
const clientSecret = env("GOOGLE_CLIENT_SECRET");
if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    // Required to get a refresh token back, and to get one every time.
    access_type: "offline",
    prompt: "consent",
  });

console.log("\nOpen this URL as the OWNER account:\n\n" + authUrl + "\n");

const server = createServer(async (req, res) => {
  const code = new URL(req.url, REDIRECT).searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No code");
    return;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  const data = await tokenRes.json();

  if (!data.refresh_token) {
    res.writeHead(500).end("No refresh token — check the console.");
    console.error(data);
    process.exit(1);
  }

  res.end("Done. Copy the refresh token from your terminal, then close this tab.");
  console.log("\nAdd to .env.local:\n\nGOOGLE_REFRESH_TOKEN=" + data.refresh_token + "\n");
  server.close();
  process.exit(0);
});

server.listen(PORT);
