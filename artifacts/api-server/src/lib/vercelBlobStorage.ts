import { randomUUID } from "crypto";
import type { Response as ExpressResponse } from "express";

// Storage backend for Vercel deployments, backed by Vercel Blob.
//
// Unlike the Replit/GCS backend, Vercel Blob returns absolute, publicly
// cacheable CDN URLs. Those are stored directly and rendered by the browser
// without going back through our API, so the `/api/storage/objects/*` serve
// route is effectively a no-op here (new uploads never produce relative paths).
export class VercelBlobStorageService {
  private readonly token = process.env.BLOB_READ_WRITE_TOKEN;

  async uploadBuffer(buffer: Buffer, contentType: string): Promise<string> {
    const { put } = await import("@vercel/blob");
    const id = randomUUID();
    const blob = await put(`uploads/${id}`, buffer, {
      access: "public",
      contentType,
      token: this.token,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Absolute Blob URLs are already render-ready.
  toPublicUrl(stored: string): string {
    return stored;
  }

  // Presigned client-direct uploads aren't used on Vercel; the frontend uploads
  // via the server-side multipart endpoint instead.
  async getObjectEntityUploadURL(): Promise<string> {
    throw new Error(
      "Presigned uploads are not supported on Vercel Blob. Use the " +
        "server-side multipart upload endpoint (POST /api/storage/uploads).",
    );
  }

  normalizeObjectEntityPath(rawPath: string): string {
    return rawPath;
  }

  async serveObject(_objectPath: string, res: ExpressResponse): Promise<void> {
    res.status(404).json({ error: "Object not found" });
  }

  async servePublicObject(_filePath: string, res: ExpressResponse): Promise<void> {
    res.status(404).json({ error: "File not found" });
  }
}
