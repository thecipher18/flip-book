"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FlipBook from "@/components/FlipBook";
import { getPhotosByTag, type Photo } from "@/lib/photos";
import { useAuth } from "@/context/AuthContext";

export default function FlipBookPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag);
  const router = useRouter();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getPhotosByTag(decodedTag, user.uid)
      .then(setPhotos)
      .finally(() => setLoading(false));
  }, [decodedTag, user]);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl flex items-center justify-between mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-stone-400 hover:text-white transition text-sm"
        >
          ← Back
        </button>
        <h1 className="text-white font-bold text-xl">{decodedTag}</h1>
        <span className="text-stone-500 text-sm">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm mt-20">Loading...</p>
      ) : (
        <FlipBook photos={photos} />
      )}
    </div>
  );
}
