import type { Response as ExpressResponse } from "express";
import { ObjectStorageService } from "./objectStorage";
import { VercelBlobStorageService } from "./vercelBlobStorage";

// Common surface both storage backends implement. Routes depend on this rather
// than a concrete provider so the app runs unchanged on Replit (GCS) and on
// Vercel (Blob).
export interface StorageService {
  uploadBuffer(buffer: Buffer, contentType: string): Promise<string>;
  toPublicUrl(stored: string): string;
  serveObject(objectPath: string, res: ExpressResponse): Promise<void>;
  servePublicObject(filePath: string, res: ExpressResponse): Promise<void>;
}

export type StorageProvider = "vercel" | "replit";

function selectProvider(): StorageProvider {
  const explicit = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (explicit === "vercel" || explicit === "replit") return explicit;
  return process.env.BLOB_READ_WRITE_TOKEN ? "vercel" : "replit";
}

export function getStorageProvider(): StorageProvider {
  return selectProvider();
}

let instance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (instance) return instance;
  instance =
    selectProvider() === "vercel"
      ? new VercelBlobStorageService()
      : new ObjectStorageService();
  return instance;
}
