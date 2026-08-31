# Flip Book

A digital flip book app. Photos live in **one shared Google Drive library**,
grouped by trip/occasion, displayed with a page-turn animation.

No database, no billing account. The library is a folder in the owner's Drive;
everyone signs in with Google to view it, and an email allowlist decides who can
upload.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Google Identity Services — sign-in (identity only)
- Google Drive API — storage _and_ metadata, via the owner's account
- `react-pageflip` — animation

## How it works

There is no database. Drive itself holds the structure:

```
Owner's Drive
└── Flip Book/
    ├── Japan 2024/      ← an album
    │   ├── IMG_001.jpg
    │   └── IMG_002.jpg
    └── Wedding/
        └── IMG_010.jpg
```

- **Album** = a subfolder of `Flip Book`
- **Photo order** = `createdTime`, ascending (chronological)
- **Cover** = first photo in the folder

### Why a server proxy

`drive.file` is per-file, per-user: a file the app created for user A is
invisible to user B, and picking a _folder_ in the Google Picker does not grant
access to what's inside it. So a shared library can't be done client-side
without a sensitive scope and Google verification review.

Instead the server holds one refresh token for the owner account and does all
Drive work with it:

```
browser ──Google access token──> /api/*  ──owner's Drive token──> Drive API
```

- Viewers grant this app **`email profile` only**. It never touches their Drive.
- Photos stay **private** — nothing is link-shared. Bytes are streamed through
  `/api/photos/[fileId]` and rendered from object URLs.
- Every API route verifies the caller's token with Google, including that it was
  issued to **this** client ID. Writes additionally require the allowlist.

## Setup

### 1. Create a Google Cloud project

[console.cloud.google.com](https://console.cloud.google.com) → create or select a project.

### 2. Enable the Drive API

**APIs & Services** → **Library** → search "Google Drive API" → **Enable**.

### 3. Configure the OAuth consent screen

**APIs & Services** → **OAuth consent screen**:

- User type: **External**
- Add the scope `.../auth/drive.file` (non-sensitive — no Google verification review required)
- While the app is in **Testing**, only listed test users can sign in. Add every
  viewer under **Test users**, or **Publish** the app.

### 4. Create an OAuth client ID

**APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**:

- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:53682` (used once, by the mint script)

Copy the client ID **and** the client secret.

### 5. Configure the environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` (same value),
`GOOGLE_CLIENT_SECRET`, and `WRITER_EMAILS`.

### 6. Mint the owner's refresh token

```bash
npm install
npm run mint-token
```

Open the printed URL **signed in as the account that should hold the library**,
approve, then paste the printed `GOOGLE_REFRESH_TOKEN=` line into `.env.local`.

`.env.local` is not hot-reloaded — restart the dev server after editing it.

### 7. Run

```bash
npm run dev
```

## Access model

| Who                             | Can view | Can upload |
| ------------------------------- | -------- | ---------- |
| Not signed in                   | ✗        | ✗          |
| Signed in with Google           | ✓        | ✗          |
| Email listed in `WRITER_EMAILS` | ✓        | ✓          |

`canWrite` reaching the browser only hides the upload UI. `/api/upload`
re-checks the allowlist server-side on every request.

## Scripts

| Script               | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `npm run dev`        | Dev server                                                           |
| `npm run build`      | Production build                                                     |
| `npm run lint`       | ESLint                                                               |
| `npm test`           | Pure-helper self-checks (query escaping, token freshness, allowlist) |
| `npm run mint-token` | One-time: mint the owner's Drive refresh token                       |

## Scope

The owner's token carries only `https://www.googleapis.com/auth/drive.file`,
which grants per-file access to files **the app itself created**. It cannot read
the rest of the owner's Drive.

The flip side: photos added to the `Flip Book` folder manually from Drive are
invisible to the app. Upload through the app instead.

## Known limitations

| Limitation                     | Notes                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| All traffic proxied            | Every photo view hits your server, then the Drive API. Fine at personal scale.           |
| No CDN                         | Photo responses are `Cache-Control: private` — browser cache only, never a shared cache. |
| Owner storage is shared        | Everyone's uploads consume the owner account's Drive quota.                              |
| Deleting a photo in Drive      | Renders a "Photo unavailable" placeholder.                                               |
| One tag per photo              | A file lives in one folder. Drive `appProperties` would allow multiple.                  |
| No custom ordering             | Chronological only. `appProperties` could store an explicit order.                       |
| Silent token re-grant can fail | Cookie-restrictive browsers or an expired Google session fall back to the consent popup. |

## Project layout

```
lib/ownerDrive.ts   Server-side Drive client, owner refresh token (SECRETS)
lib/apiAuth.ts      Verifies caller tokens, enforces the writer allowlist
lib/drive.ts        Client-side wrapper over /api/*
lib/driveToken.ts   GIS token client — silent re-grant, caching, expiry
lib/driveQuery.ts   Pure helpers (query escaping, token freshness, allowlist)
app/api/            me, albums, albums/[folderId], photos/[fileId], upload
context/            Auth provider + useRequireAuth gate
components/         DriveImage, FlipBook, TagCard
scripts/            One-time refresh-token mint
```
