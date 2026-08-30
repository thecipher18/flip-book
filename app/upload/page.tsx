"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadPhoto, getTagsWithCover } from "@/lib/photos";
import { useEffect } from "react";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [tag, setTag] = useState("");
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getTagsWithCover().then((t) => setExistingTags(t.map((x) => x.tag)));
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || !tag.trim() || !user) return;
    setUploading(true);
    setError("");
    try {
      await Promise.all(
        files.map((file, i) => uploadPhoto(file, tag.trim(), i, user.uid)),
      );
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">
        <button
          onClick={() => router.push("/")}
          className="text-stone-400 hover:text-stone-700 transition text-sm mb-6 block"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-stone-800 mb-6">Add Photos</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Tag input */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Album / Tag
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Japan 2024"
                list="tag-suggestions"
                required
                className="w-full border border-stone-300 rounded-xl px-4 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <datalist id="tag-suggestions">
                {existingTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            {/* File picker */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Photos
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:border-stone-500 transition"
              >
                {files.length > 0 ? (
                  <p className="text-stone-700 font-medium">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </p>
                ) : (
                  <>
                    <p className="text-3xl mb-2">📷</p>
                    <p className="text-stone-400 text-sm">
                      Click to select photos
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={uploading || !files.length || !tag.trim()}
              className="bg-stone-800 text-white rounded-xl py-3 font-semibold hover:bg-stone-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
