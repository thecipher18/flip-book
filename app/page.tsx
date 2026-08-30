"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import TagCard from "@/components/TagCard";
import { getTagsWithCover } from "@/lib/photos";

export default function HomePage() {
  const { user, logOut } = useAuth();
  const [tags, setTags] = useState<{ tag: string; coverUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTagsWithCover()
      .then(setTags)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <h1 className="text-xl font-bold text-stone-800">Flip Book</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/upload"
            className="text-sm font-medium text-stone-600 hover:text-stone-900 transition"
          >
            + Add Photos
          </Link>
          <button
            onClick={logOut}
            className="text-sm text-stone-400 hover:text-stone-700 transition"
          >
            Sign out
          </button>
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Your Albums</h2>

        {loading && <p className="text-stone-400 text-sm">Loading albums...</p>}

        {!loading && tags.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-lg font-medium">No albums yet</p>
            <p className="text-sm mt-1">
              <Link href="/upload" className="underline hover:text-stone-600">
                Upload some photos
              </Link>{" "}
              to get started.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tags.map(({ tag, coverUrl }) => (
            <TagCard key={tag} tag={tag} coverUrl={coverUrl} />
          ))}
        </div>
      </main>
    </div>
  );
}
