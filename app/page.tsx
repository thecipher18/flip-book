"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import TagCard from "@/components/TagCard";
import { listAlbums, type Album } from "@/lib/drive";

export default function HomePage() {
  const { logOut } = useAuth();
  const { user, ready } = useRequireAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    listAlbums()
      .then(setAlbums)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [ready]);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <h1 className="text-xl font-bold text-stone-800">Flip Book</h1>
        </div>
        <div className="flex items-center gap-4">
          {user?.canWrite && (
            <Link
              href="/upload"
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition"
            >
              + Add Photos
            </Link>
          )}
          <button
            onClick={logOut}
            className="text-sm text-stone-400 hover:text-stone-700 transition"
          >
            Sign out
          </button>
          {user?.picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Albums</h2>

        {loading && <p className="text-stone-400 text-sm">Loading albums...</p>}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && albums.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-lg font-medium">No albums yet</p>
            {user?.canWrite ? (
              <p className="text-sm mt-1">
                <Link href="/upload" className="underline hover:text-stone-600">
                  Upload some photos
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <p className="text-sm mt-1">Nothing has been shared yet.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.map((album) => (
            <TagCard
              key={album.id}
              id={album.id}
              name={album.name}
              coverId={album.coverId}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
