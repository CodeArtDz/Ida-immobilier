// Resolves a stored media/avatar value into a URL the browser can load,
// transparently across storage backends:
// - Absolute URLs (Vercel Blob CDN) are used as-is.
// - Values already prefixed with `/api/storage` are used as-is.
// - Legacy normalized `/objects/<id>` paths (Replit/GCS) get the API prefix.
export function resolveStorageUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  if (value.startsWith("/api/storage")) return value;
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  return value;
}
