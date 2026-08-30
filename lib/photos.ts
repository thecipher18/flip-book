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

export async function getPhotosByTag(
  tag: string,
  userId: string,
): Promise<Photo[]> {
  const q = query(
    collection(db, "photos"),
    where("uploadedBy", "==", userId),
    where("tag", "==", tag),
    orderBy("order", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Photo);
}

export async function getTagsWithCover(
  userId: string,
): Promise<{ tag: string; coverUrl: string }[]> {
  const q = query(collection(db, "photos"), where("uploadedBy", "==", userId));
  const snap = await getDocs(q);
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
