// Server-only: this module reads GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN.
// It must never be imported from a "use client" file.
import { escapeQueryValue, isTokenFresh } from "./driveQuery";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_NAME = "Flip Book";

export interface Album {
  id: string;
  name: string;
  coverId: string | null;
}

export interface DrivePhoto {
  id: string;
  name: string;
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// The whole library lives in one Google account's Drive. Every request is made
// with that account's token, never the caller's — the caller's own Drive is not
// involved, and `drive.file` can't span accounts anyway.
let owner: { token: string; expiresAt: number } | null = null;

async function ownerToken(): Promise<string> {
  if (owner && isTokenFresh(owner.expiresAt, Date.now())) return owner.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: env("GOOGLE_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Owner token refresh failed (${res.status})`);
  }
  const { access_token, expires_in } = await res.json();
  owner = {
    token: access_token,
    expiresAt: Date.now() + Number(expires_in) * 1000,
  };
  return access_token;
}

async function driveFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await ownerToken();
  const res = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  }
  return res;
}

async function listFiles(q: string, orderBy: string): Promise<DrivePhoto[]> {
  const params = new URLSearchParams({
    q,
    orderBy,
    fields: "files(id,name)",
    pageSize: "200",
  });
  const res = await driveFetch(`/files?${params}`);
  const { files } = await res.json();
  return files ?? [];
}

async function createFolder(name: string, parent: string): Promise<string> {
  const res = await driveFetch("/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parent] }),
  });
  return (await res.json()).id;
}

async function findFolder(
  name: string,
  parent: string,
): Promise<string | null> {
  const q = [
    `name='${escapeQueryValue(name)}'`,
    `mimeType='${FOLDER_MIME}'`,
    `'${parent}' in parents`,
    "trashed=false",
  ].join(" and ");
  const found = await listFiles(q, "name");
  return found[0]?.id ?? null;
}

let rootFolderId: string | null = null;

/** The single "Flip Book" folder in the owner's Drive, created on demand. */
async function getRootFolder(): Promise<string> {
  if (rootFolderId) return rootFolderId;
  rootFolderId =
    (await findFolder(ROOT_FOLDER_NAME, "root")) ??
    (await createFolder(ROOT_FOLDER_NAME, "root"));
  return rootFolderId;
}

export async function listPhotos(folderId: string): Promise<DrivePhoto[]> {
  const q = [
    `'${folderId}' in parents`,
    "mimeType contains 'image/'",
    "trashed=false",
  ].join(" and ");
  // Chronological is the natural reading order for a trip flip book, and it
  // means no per-photo `order` needs storing anywhere.
  return listFiles(q, "createdTime");
}

/** One subfolder per tag. The folder list *is* the album list. */
export async function listAlbums(): Promise<Album[]> {
  const root = await getRootFolder();
  const q = [
    `'${root}' in parents`,
    `mimeType='${FOLDER_MIME}'`,
    "trashed=false",
  ].join(" and ");
  const folders = await listFiles(q, "name");

  // ponytail: N+1 — one cover lookup per album. Fine for a personal library;
  // if album counts grow, fetch covers lazily inside TagCard instead.
  return Promise.all(
    folders.map(async (f) => ({
      id: f.id,
      name: f.name,
      coverId: (await listPhotos(f.id))[0]?.id ?? null,
    })),
  );
}

export async function getAlbumName(folderId: string): Promise<string> {
  const res = await driveFetch(`/files/${encodeURIComponent(folderId)}?fields=name`);
  return (await res.json()).name;
}

export async function findOrCreateAlbum(name: string): Promise<string> {
  const root = await getRootFolder();
  return (await findFolder(name, root)) ?? createFolder(name, root);
}

export async function uploadPhoto(
  file: File,
  folderId: string,
): Promise<string> {
  const metadata = { name: file.name, parents: [folderId] };
  const body = new FormData();
  body.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  body.append("file", file);

  // No Content-Type header — fetch must set the multipart boundary.
  const res = await driveFetch(`${UPLOAD}?uploadType=multipart&fields=id`, {
    method: "POST",
    body,
  });
  return (await res.json()).id;
}

/**
 * Raw bytes for one photo. Files stay private in Drive — nothing is ever
 * link-shared — so the server streams them out under its own token.
 */
export async function getPhotoResponse(fileId: string): Promise<Response> {
  return driveFetch(`/files/${encodeURIComponent(fileId)}?alt=media`);
}
