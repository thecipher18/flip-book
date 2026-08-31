"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FlipBook from "@/components/FlipBook";
import { useRequireAuth } from "@/context/AuthContext";
import { getAlbum, type DrivePhoto } from "@/lib/drive";

export default function FlipBookPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const router = useRouter();
  const { ready } = useRequireAuth();

  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    getAlbum(folderId)
      .then((album) => {
        setName(album.name);
        setPhotos(album.photos);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [folderId, ready]);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl flex items-center justify-between mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-stone-400 hover:text-white transition text-sm"
        >
          ← Back
        </button>
        <h1 className="text-white font-bold text-xl">{name}</h1>
        <span className="text-stone-500 text-sm">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && <p className="text-red-400 text-sm mt-20">{error}</p>}

      {!error &&
        (loading ? (
          <p className="text-stone-400 text-sm mt-20">Loading...</p>
        ) : (
          <FlipBook photos={photos} />
        ))}
    </div>
  );
}
