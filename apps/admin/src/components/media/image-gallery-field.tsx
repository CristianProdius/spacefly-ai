"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Images,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";
import { reorderImages } from "./image-gallery-field.shared";

const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

interface ImageGalleryFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadError: string | null;
  altPrefix: string;
}

const ImageGalleryField = ({
  images,
  onChange,
  onUpload,
  uploading,
  uploadError,
  altPrefix,
}: ImageGalleryFieldProps) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const openLibrary = async () => {
    setLibraryOpen(true);
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const response = await apiFetch(`${PRODUCT_SERVICE_URL}/spaces/host/media`);
      if (!response.ok) {
        throw new Error("Could not load your photo library");
      }
      const body = (await response.json()) as { images?: unknown };
      const urls = Array.isArray(body.images)
        ? body.images.filter((url): url is string => typeof url === "string" && url.length > 0)
        : [];
      setLibraryImages(urls);
    } catch (error) {
      setLibraryError(
        error instanceof Error ? error.message : "Could not load your photo library",
      );
    } finally {
      setLibraryLoading(false);
    }
  };

  const addFromLibrary = (url: string) => {
    if (images.includes(url)) return;
    onChange([...images, url]);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {images.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragEnd={() => setDraggingIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingIndex == null) return;
              onChange(reorderImages(images, draggingIndex, index));
              setDraggingIndex(null);
            }}
            className={cn(
              "relative aspect-square cursor-grab overflow-hidden rounded-lg border border-border/60 bg-accent/20 active:cursor-grabbing",
              draggingIndex === index && "opacity-60",
            )}
          >
            <Image
              src={imageUrl}
              alt={`${altPrefix} ${index + 1}`}
              fill
              className="object-cover"
            />
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
              <GripVertical className="size-3" />
              {index === 0 ? "Cover" : index + 1}
            </span>
            {index !== 0 && (
              <button
                type="button"
                onClick={() => onChange(reorderImages(images, index, 0))}
                className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white hover:bg-black/85"
              >
                Use as cover
              </button>
            )}
            {/* Arrow buttons: HTML5 drag-and-drop doesn't fire on touch
                screens, so phones/tablets reorder with these instead. */}
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onChange(reorderImages(images, index, index - 1))}
                aria-label={`Move image ${index + 1} left`}
                className="inline-flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/85 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={index === images.length - 1}
                onClick={() => onChange(reorderImages(images, index, index + 1))}
                aria-label={`Move image ${index + 1} right`}
                className="inline-flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/85 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                onChange(images.filter((_, imageIndex) => imageIndex !== index))
              }
              aria-label={`Remove image ${index + 1}`}
              className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-accent/20 px-4 text-center transition-colors hover:border-primary/40 hover:bg-accent/30">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => void openLibrary()}
          className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-accent/20 px-4 text-center transition-colors hover:border-primary/40 hover:bg-accent/30"
        >
          <Images className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Choose from library
          </span>
        </button>
      </div>

      {uploadError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadError}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Drag photos to change their order. The first image is the cover.
      </p>

      {libraryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo library"
        >
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-xl border border-border bg-background p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Your uploaded photos</h3>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
              >
                Close
              </button>
            </div>
            {libraryLoading ? (
              <p className="text-sm text-muted-foreground">Loading photos…</p>
            ) : libraryError ? (
              <p className="text-sm text-destructive">{libraryError}</p>
            ) : libraryImages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos uploaded yet. Upload one here first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {libraryImages.map((url) => {
                  const already = images.includes(url);
                  return (
                    <button
                      key={url}
                      type="button"
                      disabled={already}
                      onClick={() => addFromLibrary(url)}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg border border-border/60",
                        already
                          ? "cursor-not-allowed opacity-50"
                          : "hover:ring-2 hover:ring-primary/40",
                      )}
                    >
                      <Image src={url} alt="" fill className="object-cover" />
                      {already && (
                        <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
                          Added
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryField;
