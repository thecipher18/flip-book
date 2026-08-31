# Flip Book

A digital flip book app. Photos live in **your own Google Drive**, grouped by trip/occasion, displayed with a page-turn animation.

No backend, no database, no billing account. Each user's photos stay in their own Drive.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Google Identity Services — auth + Drive authorization
- Google Drive API — storage _and_ metadata
- `react-pageflip` — animation

## How it works

There is no database. Drive itself holds the structure:

```
Your Drive
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

Photos stay **private**. The app fetches bytes with your access token and renders them from object URLs — nothing is made link-public.

## Setup

### 1. Create a Google Cloud project

[console.cloud.google.com](https://console.cloud.google.com) → create or select a project.

### 2. Enable the Drive API

**APIs & Services** → **Library** → search "Google Drive API" → **Enable**.

### 3. Configure the OAuth consent screen

**APIs & Services** → **OAuth consent screen**:

- User type: **External**
- Add the scope `.../auth/drive.file` (non-sensitive — no Google verification review required)
- While the app is in **Testing**, only listed test users can sign in. Add your own Google account under **Test users**, or **Publish** the app.

### 4. Create an OAuth client ID

**APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**:

- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:3000`

Copy the client ID.

### 5. Configure the environment

Create `.env.local` in the project root:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

`.env.local` is not hot-reloaded — restart the dev server after editing it.

### 6. Run

```bash
npm install
npm run dev
```

## Scripts

| Script          | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `npm run dev`   | Dev server                                                |
| `npm run build` | Production build                                          |
| `npm run lint`  | ESLint                                                    |
| `npm test`      | Pure-helper self-checks (query escaping, token freshness) |

## Scope

The app requests only `https://www.googleapis.com/auth/drive.file`, which grants
per-file access to files **the app itself created**. It cannot read the rest of
your Drive.

The flip side: photos you add to the `Flip Book` folder manually from Drive are
invisible to the app. Upload through the app instead. (Adding a Google Picker
would let you hand it specific existing files.)

## Known limitations

| Limitation                     | Notes                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| No CDN                         | Every view hits the Drive API. Fine at personal scale.                                   |
| Blob cache is in-memory        | Photos re-download once per page load. Upgrade to the Cache API if it drags.             |
| Deleting a photo in Drive      | Renders a "Photo unavailable" placeholder.                                               |
| One tag per photo              | A file lives in one folder. Drive `appProperties` would allow multiple.                  |
| No custom ordering             | Chronological only. `appProperties` could store an explicit order.                       |
| Silent token re-grant can fail | Cookie-restrictive browsers or an expired Google session fall back to the consent popup. |

## Project layout

```
lib/driveToken.ts   GIS token client — silent re-grant, caching, expiry
lib/drive.ts        Drive API: folders, listing, upload, byte fetch
lib/driveQuery.ts   Pure helpers (query escaping, token freshness)
context/            Auth provider + useRequireAuth gate
components/         DriveImage, FlipBook, TagCard
app/                login, album grid, flipbook/[folderId], upload
```
