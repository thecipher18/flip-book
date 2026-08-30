"use client";

import Image from "next/image";
import Link from "next/link";

interface TagCardProps {
  tag: string;
  coverUrl: string;
}

export default function TagCard({ tag, coverUrl }: TagCardProps) {
  return (
    <Link
      href={`/flipbook/${encodeURIComponent(tag)}`}
      className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-[3/4] bg-stone-200"
    >
      <Image
        src={coverUrl}
        alt={tag}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-3 left-4 right-4 text-white font-semibold text-lg truncate drop-shadow">
        {tag}
      </span>
    </Link>
  );
}
