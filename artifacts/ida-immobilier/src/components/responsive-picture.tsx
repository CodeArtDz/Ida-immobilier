import type { MouseEventHandler } from "react";

export interface PictureMedia {
  url: string;
  watermarkedUrl?: string | null;
  webpUrl?: string | null;
  avifUrl?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

interface ResponsivePictureProps {
  media?: PictureMedia | null;
  /** Fallback image src when no media (or no usable url) is available. */
  fallback?: string;
  /** Overrides the alt text from the media record. */
  alt?: string;
  /** Class applied to the inner <img>. */
  className?: string;
  /** Class applied to the wrapping <picture> (for positioning/transitions). */
  pictureClassName?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  onClick?: MouseEventHandler<HTMLImageElement>;
}

/**
 * Renders a <picture> with AVIF + WebP sources and a JPEG fallback, plus
 * intrinsic width/height to reduce layout shift. Gracefully degrades to a plain
 * <img> when modern variants are missing (legacy uploads).
 */
export function ResponsivePicture({
  media,
  fallback,
  alt,
  className,
  pictureClassName,
  loading = "lazy",
  draggable,
  onClick,
}: ResponsivePictureProps) {
  const base = media?.watermarkedUrl || media?.url || fallback || "";
  const altText = alt ?? media?.alt ?? "";

  return (
    <picture className={pictureClassName}>
      {media?.avifUrl && <source srcSet={media.avifUrl} type="image/avif" />}
      {media?.webpUrl && <source srcSet={media.webpUrl} type="image/webp" />}
      <img
        src={base}
        alt={altText}
        className={className}
        width={media?.width ?? undefined}
        height={media?.height ?? undefined}
        loading={loading}
        draggable={draggable}
        onClick={onClick}
      />
    </picture>
  );
}
