"use client";

import Link from "next/link";
import DriveImage from "./DriveImage";

interface TagCardProps {
  id: string;
  name: string;
  coverId: string | null;
}

export default function TagCard({ id, name, coverId }: TagCardProps) {
  return (
    <Link
      href={`/flipbook/${id}`}
      className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-[3/4] bg-stone-200"
    >
      {coverId ? (
        <DriveImage
          fileId={coverId}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          📷
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-3 left-4 right-4 text-white font-semibold text-lg truncate drop-shadow">
        {name}
      </span>
    </Link>
  );
}
