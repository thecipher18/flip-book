"use client";

import { useEffect, useState } from "react";
import { getPhotoObjectUrl } from "@/lib/drive";

interface DriveImageProps {
  fileId: string;
  alt: string;
  className?: string;
}

interface Loaded {
  fileId: string;
  src: string | null;
  failed: boolean;
}

/**
 * Drive files are private, so they can't be used as a plain image src — the
 * bytes are fetched with the access token and handed over as an object URL.
 * That rules out next/image, which needs a fetchable URL.
 */
export default function DriveImage({ fileId, alt, className }: DriveImageProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let alive = true;

    getPhotoObjectUrl(fileId)
      .then((src) => alive && setLoaded({ fileId, src, failed: false }))
      .catch(() => alive && setLoaded({ fileId, src: null, failed: true }));

    return () => {
      alive = false;
    };
  }, [fileId]);

  // Tagging the result with its fileId means a changed prop reads as loading
  // rather than briefly showing the previous photo.
  const current = loaded?.fileId === fileId ? loaded : null;

  // Photos live in the user's own Drive, so they can vanish out from under us.
  if (current?.failed) {
    return (
      <div
        className={`${className ?? ""} flex items-center justify-center bg-stone-200 text-stone-400 text-xs`}
      >
        Photo unavailable
      </div>
    );
  }

  if (!current?.src) {
    return <div className={`${className ?? ""} bg-stone-200 animate-pulse`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={current.src} alt={alt} className={className} />;
}
