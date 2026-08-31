"use client";

import { requestToken } from "./driveToken";

// The client never talks to Google Drive. The library lives in one owner
// account, so every read and write goes through this app's API routes, which
// hold the owner's credentials. Google sign-in here is identity only.

export interface Album {
  id: string;
  name: string;
  coverId: string | null;
}

export interface DrivePhoto {
  id: string;
  name: string;
}

export interface Profile {
  email: string;
  name: string;
  picture: string;
  /** Set by the server's WRITER_EMAILS allowlist. UI hint only — the API
   *  re-checks it on every write. */
  canWrite: boolean;
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await requestToken(false);
  const res = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error ?? `Request failed (${res.status})`);
  }
  return res;
}

export async function listAlbums(): Promise<Album[]> {
  return (await api("/api/albums")).json();
}

export async function getAlbum(
  folderId: string,
): Promise<{ name: string; photos: DrivePhoto[] }> {
  return (await api(`/api/albums/${encodeURIComponent(folderId)}`)).json();
}

export async function uploadPhotos(files: File[], tag: string): Promise<void> {
  const body = new FormData();
  body.append("tag", tag);
  files.forEach((file) => body.append("files", file));
  await api("/api/upload", { method: "POST", body });
}

// ponytail: in-memory only, so photos re-download once per page load.
// Upgrade to the Cache API if that becomes noticeable.
const blobCache = new Map<string, string>();

/** Photos are private in Drive, so bytes come through the API with the
 *  caller's token and are handed to <img> as an object URL. */
export async function getPhotoObjectUrl(fileId: string): Promise<string> {
  const hit = blobCache.get(fileId);
  if (hit) return hit;
  const res = await api(`/api/photos/${encodeURIComponent(fileId)}`);
  const url = URL.createObjectURL(await res.blob());
  blobCache.set(fileId, url);
  return url;
}

export async function getProfile(): Promise<Profile> {
  return (await api("/api/me")).json();
}
