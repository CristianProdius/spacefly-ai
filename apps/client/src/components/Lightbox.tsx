"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  alt: string;
}

const Lightbox = ({ images, initialIndex, open, onClose, alt }: LightboxProps) => {
  const t = useTranslations("spaces");
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset currentIndex when open or initialIndex changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, images.length]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // Preload adjacent images
  useEffect(() => {
    if (!open) return;
    const toPreload = [currentIndex - 1, currentIndex + 1].filter(
      (i) => i >= 0 && i < images.length
    );
    toPreload.forEach((i) => {
      const img = new window.Image();
      img.src = images[i];
    });
  }, [open, currentIndex, images]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (!open || !thumbnailStripRef.current) return;
    const activeThumbnail = thumbnailStripRef.current.children[currentIndex] as HTMLElement | undefined;
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [open, currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 50 && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (delta < -50 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/95" />
        <Dialog.Popup className="fixed inset-0 z-50 flex flex-col items-center justify-center">
          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {t("photoCounter", { current: currentIndex + 1, total: images.length })}
          </div>

          {/* Close button */}
          <Dialog.Close className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer">
            <X className="size-6" />
          </Dialog.Close>

          {/* Main image area */}
          <div
            className="relative flex items-center justify-center flex-1 w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Previous button */}
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="absolute left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-10" />
              </button>
            )}

            {/* Image */}
            <div className="relative max-h-[80vh] max-w-[90vw] w-full h-full">
              <Image
                src={images[currentIndex]}
                alt={`${alt} - ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            {/* Next button */}
            {currentIndex < images.length - 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="absolute right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="size-10" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          <div
            ref={thumbnailStripRef}
            className="flex gap-2 overflow-x-auto px-4 py-3 max-w-full"
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative size-16 shrink-0 rounded overflow-hidden cursor-pointer transition-all ${
                  idx === currentIndex
                    ? "ring-2 ring-white"
                    : "opacity-50 hover:opacity-75"
                }`}
              >
                <Image
                  src={img}
                  alt={`${alt} - ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Lightbox;
