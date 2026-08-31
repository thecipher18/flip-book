"use client";

import { escapeQueryValue } from "./driveQuery";
import { requestToken } from "./driveToken";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";
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

export interface Profile {
  email: string;
  name: string;
  picture: string;
}

async function driveFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await requestToken(false);
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

/** The single "Flip Book" folder in the user's Drive root, created on demand. */
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
  const res = await driveFetch(`/files/${folderId}?fields=name`);
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

  // No Content-Type header — the browser must set the multipart boundary.
  const res = await driveFetch(`${UPLOAD}?uploadType=multipart&fields=id`, {
    method: "POST",
    body,
  });
  return (await res.json()).id;
}

// ponytail: in-memory only, so photos re-download once per page load.
// Upgrade to the Cache API if that becomes noticeable.
const blobCache = new Map<string, string>();

/** Files stay private in Drive, so bytes are fetched with the access token. */
export async function getPhotoObjectUrl(fileId: string): Promise<string> {
  const hit = blobCache.get(fileId);
  if (hit) return hit;
  const res = await driveFetch(`/files/${fileId}?alt=media`);
  const url = URL.createObjectURL(await res.blob());
  blobCache.set(fileId, url);
  return url;
}

export async function getProfile(): Promise<Profile> {
  const res = await driveFetch(USERINFO);
  return res.json();
}
