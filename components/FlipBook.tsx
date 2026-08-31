"use client";

import { useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import DriveImage from "./DriveImage";
import type { DrivePhoto } from "@/lib/drive";

interface FlipBookProps {
  photos: DrivePhoto[];
}

// react-pageflip doesn't export its ref type, so we use a loose ref
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlipBookRef = any;

export default function FlipBook({ photos }: FlipBookProps) {
  const bookRef = useRef<FlipBookRef>(null);

  if (photos.length === 0) {
    return (
      <div className="text-stone-400 text-center py-20">
        No photos in this album.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <HTMLFlipBook
        ref={bookRef}
        width={320}
        height={420}
        showCover
        className="shadow-2xl"
        style={{}}
        startPage={0}
        size="fixed"
        minWidth={320}
        maxWidth={320}
        minHeight={420}
        maxHeight={420}
        drawShadow
        maxShadowOpacity={0.5}
        flippingTime={600}
        usePortrait
        startZIndex={0}
        autoSize={false}
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        mobileScrollSupport
        onFlip={() => {}}
        onChangeOrientation={() => {}}
        onChangeState={() => {}}
        onInit={() => {}}
        onUpdate={() => {}}
      >
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="relative w-full h-full bg-stone-100 overflow-hidden"
          >
            <DriveImage
              fileId={photo.id}
              alt={`Page ${i + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute bottom-2 right-3 text-xs text-stone-400">
              {i + 1} / {photos.length}
            </span>
          </div>
        ))}
      </HTMLFlipBook>

      <div className="flex gap-4">
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition"
        >
          ← Prev
        </button>
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
