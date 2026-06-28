import sharp from "sharp";

export interface ImageVariants {
  webp: Buffer;
  avif: Buffer;
  width: number | null;
  height: number | null;
}

/**
 * Generates modern responsive variants (WebP + AVIF) from an image buffer and
 * reads its intrinsic dimensions. Used at upload time for image SEO and Core
 * Web Vitals (smaller payloads + explicit width/height to avoid layout shift).
 *
 * The input should be the watermarked buffer so the variants carry the
 * watermark too. Throws if the buffer is not a decodable image.
 */
export async function generateImageVariants(input: Buffer): Promise<ImageVariants> {
  const pipeline = sharp(input, { failOn: "none" });
  const metadata = await pipeline.metadata();

  const [webp, avif] = await Promise.all([
    sharp(input, { failOn: "none" }).webp({ quality: 82 }).toBuffer(),
    sharp(input, { failOn: "none" }).avif({ quality: 55 }).toBuffer(),
  ]);

  return {
    webp,
    avif,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}
