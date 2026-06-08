import { Router } from "express";
import { db, propertiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const STATIC_ROUTES: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: "/",                  changefreq: "daily",   priority: "1.0" },
  { loc: "/acheter",           changefreq: "daily",   priority: "0.9" },
  { loc: "/louer",             changefreq: "daily",   priority: "0.9" },
  { loc: "/programmes-neufs",  changefreq: "weekly",  priority: "0.8" },
  { loc: "/estimation",        changefreq: "monthly", priority: "0.8" },
  { loc: "/nos-agences",       changefreq: "monthly", priority: "0.7" },
  { loc: "/a-propos",          changefreq: "monthly", priority: "0.6" },
  { loc: "/contact",           changefreq: "monthly", priority: "0.7" },
  { loc: "/mentions-legales",  changefreq: "yearly",  priority: "0.3" },
  { loc: "/confidentialite",   changefreq: "yearly",  priority: "0.3" },
  { loc: "/cgu",               changefreq: "yearly",  priority: "0.3" },
  { loc: "/honoraires",        changefreq: "yearly",  priority: "0.3" },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const domain = process.env.SITE_DOMAIN || "https://ida-immobilier.com";

    const publishedProperties = await db
      .select({
        id: propertiesTable.id,
        updatedAt: propertiesTable.updatedAt,
      })
      .from(propertiesTable)
      .where(eq(propertiesTable.status, "published"));

    const today = new Date().toISOString().split("T")[0];

    const staticEntries = STATIC_ROUTES.map(
      (r) =>
        `  <url>\n    <loc>${escapeXml(domain + r.loc)}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    ).join("\n");

    const propertyEntries = publishedProperties
      .map((p) => {
        const lastmod = p.updatedAt
          ? new Date(p.updatedAt).toISOString().split("T")[0]
          : today;
        return `  <url>\n    <loc>${escapeXml(`${domain}/annonce/${p.id}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${staticEntries}
${propertyEntries ? "\n" + propertyEntries : ""}
</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Failed to generate sitemap");
    res.status(500).send("Internal Server Error");
  }
});

export default router;
