import sharp from "sharp";

const LOGO_PATH = "/home/runner/workspace/attached_assets/full_logo3__1780868246992.png";

// Composites the agency logo onto an image and returns the watermarked JPEG as a
// buffer. Works entirely in memory so media can be uploaded to object storage
// (the production filesystem is ephemeral and loses disk-written files).
export async function applyWatermarkBuffer(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer);
  const { width = 800, height = 600 } = await image.metadata();

  const logoWidth = Math.max(80, Math.round(Math.min(width, height) * 0.20));
  const padding = Math.max(10, Math.round(Math.min(width, height) * 0.03));

  const logoBuffer = await sharp(LOGO_PATH)
    .resize(logoWidth, undefined, { fit: "inside" })
    .ensureAlpha()
    .toBuffer();

  const logoMeta = await sharp(logoBuffer).metadata();
  const lw = logoMeta.width ?? logoWidth;
  const lh = logoMeta.height ?? logoWidth;

  const top = Math.max(0, height - lh - padding);
  const left = Math.max(0, width - lw - padding);

  return image
    .composite([{ input: logoBuffer, top, left, blend: "over" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
