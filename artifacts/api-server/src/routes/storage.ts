import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { getStorageService, getStorageProvider } from "../lib/storage";

const router: IRouter = Router();
const storage = getStorageService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

/**
 * POST /storage/uploads
 *
 * Server-mediated multipart upload. The client sends the file as `file`; the
 * server stores it via the active storage backend and returns the public URL.
 * This is the portable upload path that works on both Replit (GCS) and
 * Vercel (Blob).
 */
router.post(
  "/storage/uploads",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ error: "Aucun fichier fourni" });
        return;
      }
      const stored = await storage.uploadBuffer(file.buffer, file.mimetype);
      const objectPath = storage.toPublicUrl(stored);
      res.status(201).json({
        objectPath,
        uploadURL: "",
        metadata: {
          name: file.originalname,
          size: file.size,
          contentType: file.mimetype,
        },
      });
    } catch (error) {
      req.log.error({ err: error }, "Error handling multipart upload");
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

/**
 * POST /storage/uploads/request-url
 *
 * Presigned URL upload flow (Replit/GCS only). Kept for backward compatibility;
 * the frontend now uses the portable multipart endpoint above.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  if (getStorageProvider() !== "replit") {
    res.status(501).json({
      error:
        "Presigned uploads are not supported on this storage backend. Use POST /api/storage/uploads.",
    });
    return;
  }

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets. These are unconditionally public — no auth or ACL.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    await storage.servePublicObject(filePath, res);
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities (uploaded files).
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    await storage.serveObject(objectPath, res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
