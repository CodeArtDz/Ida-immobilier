import { Router } from "express";
import {
  db,
  propertiesTable,
  propertyMediaTable,
  citiesTable,
  usersTable,
} from "@workspace/db";
import { eq, and, inArray, asc } from "drizzle-orm";
import { buildAgentSlug, PROPERTY_TYPE_FR } from "@workspace/seo";

const router = Router();

const SITE_TYPES = ["apartment", "house", "villa", "land"] as const;

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

function domainOf(): string {
  return process.env.SITE_DOMAIN || "https://ida-immobilier.com";
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: string[];
}

function renderUrlset(entries: UrlEntry[], withImages = false): string {
  const ns = withImages
    ? ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`
    : "";
  const body = entries
    .map((e) => {
      const parts = [`    <loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
      for (const img of e.images ?? []) {
        parts.push(`    <image:image><image:loc>${escapeXml(img)}</image:loc></image:image>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${ns}>\n${body}\n</urlset>`;
}

function sendXml(res: import("express").Response, xml: string): void {
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
}

// ─── Sitemap index ────────────────────────────────────────────────────────────
router.get("/sitemap.xml", (req, res) => {
  const domain = domainOf();
  const today = new Date().toISOString().split("T")[0];
  const children = ["static", "properties", "cities", "agents", "images"];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children
  .map(
    (c) =>
      `  <sitemap>\n    <loc>${escapeXml(`${domain}/sitemap-${c}.xml`)}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;
  sendXml(res, xml);
});

router.get("/sitemap-static.xml", (_req, res) => {
  const domain = domainOf();
  sendXml(
    res,
    renderUrlset(
      STATIC_ROUTES.map((r) => ({
        loc: domain + r.loc,
        changefreq: r.changefreq,
        priority: r.priority,
      })),
    ),
  );
});

router.get("/sitemap-properties.xml", async (req, res) => {
  try {
    const domain = domainOf();
    const today = new Date().toISOString().split("T")[0];
    const published = await db
      .select({ id: propertiesTable.id, slug: propertiesTable.slug, updatedAt: propertiesTable.updatedAt })
      .from(propertiesTable)
      .where(eq(propertiesTable.status, "published"));

    const ids = published.map((p) => p.id);
    const media = ids.length
      ? await db
          .select({
            propertyId: propertyMediaTable.propertyId,
            url: propertyMediaTable.url,
            watermarkedUrl: propertyMediaTable.watermarkedUrl,
          })
          .from(propertyMediaTable)
          .where(and(inArray(propertyMediaTable.propertyId, ids), eq(propertyMediaTable.type, "photo")))
          .orderBy(asc(propertyMediaTable.order))
      : [];

    const toAbsolute = (u: string): string =>
      /^https?:\/\//.test(u) ? u : `${domain}${u.startsWith("/") ? "" : "/"}${u}`;

    const imagesByProperty = new Map<number, string[]>();
    for (const m of media) {
      const list = imagesByProperty.get(m.propertyId) ?? [];
      if (list.length < 10) list.push(toAbsolute(m.watermarkedUrl ?? m.url));
      imagesByProperty.set(m.propertyId, list);
    }

    sendXml(
      res,
      renderUrlset(
        published.map((p) => ({
          loc: `${domain}/annonce/${p.slug ?? p.id}`,
          lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : today,
          changefreq: "weekly",
          priority: "0.8",
          images: imagesByProperty.get(p.id) ?? [],
        })),
        true,
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to generate properties sitemap");
    res.status(500).send("Internal Server Error");
  }
});

// ─── Dedicated image sitemap (each property URL with its <image:image> set) ─────
router.get("/sitemap-images.xml", async (req, res) => {
  try {
    const domain = domainOf();
    const today = new Date().toISOString().split("T")[0];
    const published = await db
      .select({ id: propertiesTable.id, slug: propertiesTable.slug, updatedAt: propertiesTable.updatedAt })
      .from(propertiesTable)
      .where(eq(propertiesTable.status, "published"));

    const ids = published.map((p) => p.id);
    const media = ids.length
      ? await db
          .select({
            propertyId: propertyMediaTable.propertyId,
            url: propertyMediaTable.url,
            watermarkedUrl: propertyMediaTable.watermarkedUrl,
          })
          .from(propertyMediaTable)
          .where(and(inArray(propertyMediaTable.propertyId, ids), eq(propertyMediaTable.type, "photo")))
          .orderBy(asc(propertyMediaTable.order))
      : [];

    const toAbsolute = (u: string): string =>
      /^https?:\/\//.test(u) ? u : `${domain}${u.startsWith("/") ? "" : "/"}${u}`;

    const imagesByProperty = new Map<number, string[]>();
    for (const m of media) {
      const list = imagesByProperty.get(m.propertyId) ?? [];
      list.push(toAbsolute(m.watermarkedUrl ?? m.url));
      imagesByProperty.set(m.propertyId, list);
    }

    // Only include property URLs that actually have images.
    const entries: UrlEntry[] = published
      .filter((p) => (imagesByProperty.get(p.id)?.length ?? 0) > 0)
      .map((p) => ({
        loc: `${domain}/annonce/${p.slug ?? p.id}`,
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : today,
        images: imagesByProperty.get(p.id) ?? [],
      }));

    sendXml(res, renderUrlset(entries, true));
  } catch (err) {
    req.log.error({ err }, "Failed to generate images sitemap");
    res.status(500).send("Internal Server Error");
  }
});

router.get("/sitemap-cities.xml", async (req, res) => {
  try {
    const domain = domainOf();
    const cities = await db.select().from(citiesTable).orderBy(asc(citiesTable.displayOrder));
    const entries: UrlEntry[] = [];
    for (const c of cities) {
      entries.push({ loc: `${domain}/immobilier-${c.slug}`, changefreq: "weekly", priority: "0.8" });
      entries.push({ loc: `${domain}/agence-immobiliere-${c.slug}`, changefreq: "monthly", priority: "0.7" });
      entries.push({ loc: `${domain}/estimation-immobiliere-${c.slug}`, changefreq: "monthly", priority: "0.7" });
      for (const t of SITE_TYPES) {
        entries.push({
          loc: `${domain}/${PROPERTY_TYPE_FR[t]}-a-vendre-${c.slug}`,
          changefreq: "weekly",
          priority: "0.6",
        });
      }
    }
    sendXml(res, renderUrlset(entries));
  } catch (err) {
    req.log.error({ err }, "Failed to generate cities sitemap");
    res.status(500).send("Internal Server Error");
  }
});

router.get("/sitemap-agents.xml", async (req, res) => {
  try {
    const domain = domainOf();
    const agents = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(usersTable)
      .where(
        and(
          inArray(usersTable.role, ["agent", "agency_manager", "admin", "superadmin"]),
          eq(usersTable.isActive, true),
        ),
      );
    sendXml(
      res,
      renderUrlset(
        agents.map((a) => ({
          loc: `${domain}/agents/${buildAgentSlug(a)}`,
          changefreq: "monthly",
          priority: "0.5",
        })),
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to generate agents sitemap");
    res.status(500).send("Internal Server Error");
  }
});

router.get("/robots.txt", (_req, res) => {
  const domain = domainOf();
  const body = `User-agent: *
Allow: /
Disallow: /tableau-de-bord
Disallow: /espace-client
Disallow: /connexion
Disallow: /inscription
Disallow: /api/

Sitemap: ${domain}/sitemap.xml
`;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(body);
});

export default router;
