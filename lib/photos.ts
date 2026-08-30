import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export interface Photo {
  id: string;
  url: string;
  tag: string;
  order: number;
  uploadedBy: string;
  createdAt: Date;
}

export async function getPhotosByTag(tag: string): Promise<Photo[]> {
  const q = query(
    collection(db, "photos"),
    where("tag", "==", tag),
    orderBy("order", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Photo);
}

export async function getAllTags(): Promise<string[]> {
  const snap = await getDocs(collection(db, "photos"));
  const tags = new Set(snap.docs.map((doc) => doc.data().tag as string));
  return Array.from(tags).sort();
}

export async function getTagsWithCover(): Promise<
  { tag: string; coverUrl: string }[]
> {
  const snap = await getDocs(collection(db, "photos"));
  const tagMap = new Map<string, string>();
  snap.docs.forEach((doc) => {
    const { tag, url } = doc.data();
    if (!tagMap.has(tag)) tagMap.set(tag, url);
  });
  return Array.from(tagMap.entries()).map(([tag, coverUrl]) => ({
    tag,
    coverUrl,
  }));
}

export async function uploadPhoto(
  file: File,
  tag: string,
  order: number,
  userId: string,
): Promise<void> {
  const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await addDoc(collection(db, "photos"), {
    url,
    tag,
    order,
    uploadedBy: userId,
    createdAt: serverTimestamp(),
  });
}
