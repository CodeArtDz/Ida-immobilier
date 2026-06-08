import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";

const LOGO_PATH = "/home/runner/workspace/attached_assets/full_logo3__1780868246992.png";

export async function applyWatermark(inputPath: string, outputPath: string): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const image = sharp(inputPath);
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

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await image
    .composite([{ input: logoBuffer, top, left, blend: "over" }])
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}
