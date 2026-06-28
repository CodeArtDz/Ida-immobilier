import { logger } from "./logger";

// IndexNow lets us instantly notify search engines (Bing, Yandex, etc.) when a
// URL is created or updated, instead of waiting for the next crawl. It is a
// no-op unless an INDEXNOW_KEY is configured. The key must also be served as a
// static file at `${SITE_DOMAIN}/${INDEXNOW_KEY}.txt` containing the key — the
// frontend public/ directory hosts it.
//
// Failures are swallowed (logged at debug): search-engine pinging must never
// break a publish/update flow.
export function pingIndexNow(paths: string[]): void {
  const key = process.env.INDEXNOW_KEY;
  if (!key || paths.length === 0) return;

  const domain = (process.env.SITE_DOMAIN || "https://ida-immobilier.com").replace(/\/$/, "");
  const host = domain.replace(/^https?:\/\//, "");
  const urlList = paths.map((p) => (p.startsWith("http") ? p : `${domain}${p.startsWith("/") ? "" : "/"}${p}`));

  const body = {
    host,
    key,
    keyLocation: `${domain}/${key}.txt`,
    urlList,
  };

  // Fire-and-forget; do not await so the request flow is never blocked.
  fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  })
    .then((r) => {
      if (!r.ok) logger.debug({ status: r.status }, "IndexNow ping non-OK");
    })
    .catch((err) => logger.debug({ err }, "IndexNow ping failed"));
}
