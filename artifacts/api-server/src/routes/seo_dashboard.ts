import { Router } from "express";
import {
  db,
  propertiesTable,
  articlesTable,
  citiesTable,
  usersTable,
  propertyMediaTable,
} from "@workspace/db";
import { eq, and, inArray, count, asc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logger } from "../lib/logger";
import {
  searchConsoleConnected,
  analyticsConnected,
  getServiceAccountEmail,
  gscSiteUrl,
  ga4PropertyId,
  fetchSearchConsole,
  fetchAnalytics,
  fetchPageSpeed,
} from "../lib/google";

const router = Router();

const staffOnly = [requireAuth, requireRole("superadmin", "admin")] as const;

// Static public routes mirrored from the sitemap generator.
const STATIC_ROUTE_COUNT = 12;
// Each city generates: immobilier + agence + estimation + 4 property types = 7.
const URLS_PER_CITY = 7;

function siteDomain(): string {
  return process.env.SITE_DOMAIN || "https://ida-immobilier.com";
}

function norm(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

interface IssueItem {
  type: string;
  id: number;
  label: string;
  url: string;
  detail: string | null;
}

interface DuplicateGroup {
  value: string;
  count: number;
  items: IssueItem[];
}

function findDuplicates(items: Array<IssueItem & { value: string }>): DuplicateGroup[] {
  const groups = new Map<string, Array<IssueItem & { value: string }>>();
  for (const it of items) {
    const k = norm(it.value);
    if (!k) continue;
    const list = groups.get(k) ?? [];
    list.push(it);
    groups.set(k, list);
  }
  return [...groups.values()]
    .filter((g) => g.length > 1)
    .map((g) => ({
      value: g[0]!.value,
      count: g.length,
      items: g.map(({ type, id, label, url, detail }) => ({ type, id, label, url, detail })),
    }))
    .sort((a, b) => b.count - a.count);
}

// GET /seo/audit — internal SEO health (staff only).
router.get("/seo/audit", ...staffOnly, async (_req, res) => {
  try {
    const domain = siteDomain();
    const [properties, articles, cities, [agentsRow], mediaRows] = await Promise.all([
      db
        .select({
          id: propertiesTable.id,
          title: propertiesTable.title,
          slug: propertiesTable.slug,
          city: propertiesTable.city,
          metaTitle: propertiesTable.metaTitle,
          metaDescription: propertiesTable.metaDescription,
        })
        .from(propertiesTable)
        .where(eq(propertiesTable.status, "published")),
      db
        .select({
          id: articlesTable.id,
          title: articlesTable.title,
          slug: articlesTable.slug,
          metaTitle: articlesTable.metaTitle,
          metaDescription: articlesTable.metaDescription,
        })
        .from(articlesTable)
        .where(eq(articlesTable.status, "published")),
      db
        .select({
          id: citiesTable.id,
          name: citiesTable.name,
          slug: citiesTable.slug,
          metaTitle: citiesTable.metaTitle,
          metaDescription: citiesTable.metaDescription,
        })
        .from(citiesTable)
        .orderBy(asc(citiesTable.displayOrder)),
      db
        .select({ value: count() })
        .from(usersTable)
        .where(
          and(
            inArray(usersTable.role, ["agent", "agency_manager", "admin", "superadmin"]),
            eq(usersTable.isActive, true),
          ),
        ),
      db
        .selectDistinct({ propertyId: propertyMediaTable.propertyId })
        .from(propertyMediaTable)
        .where(eq(propertyMediaTable.type, "photo")),
    ]);

    const propUrl = (p: { id: number; slug: string | null }) => `${domain}/annonce/${p.slug ?? p.id}`;
    const articleUrl = (a: { slug: string }) => `${domain}/blog/${a.slug}`;
    const cityUrl = (c: { slug: string }) => `${domain}/immobilier-${c.slug}`;

    // Build a flat list of all audited entities with their meta fields.
    const titled: Array<IssueItem & { value: string }> = [];
    const described: Array<IssueItem & { value: string }> = [];
    const missingTitle: IssueItem[] = [];
    const missingDescription: IssueItem[] = [];
    const brokenLinks: IssueItem[] = [];

    const register = (
      type: string,
      id: number,
      label: string,
      url: string,
      metaTitle: string | null,
      metaDescription: string | null,
    ) => {
      if (norm(metaTitle)) titled.push({ type, id, label, url, detail: null, value: metaTitle! });
      else missingTitle.push({ type, id, label, url, detail: "Titre SEO (meta title) manquant" });
      if (norm(metaDescription)) described.push({ type, id, label, url, detail: null, value: metaDescription! });
      else missingDescription.push({ type, id, label, url, detail: "Description SEO (meta description) manquante" });
    };

    const cityNames = new Set(cities.map((c) => norm(c.name)));

    for (const p of properties) {
      register("property", p.id, p.title, propUrl(p), p.metaTitle, p.metaDescription);
      if (!p.slug) {
        brokenLinks.push({
          type: "property",
          id: p.id,
          label: p.title,
          url: propUrl(p),
          detail: "Slug manquant — lien SEO non optimisé (repli sur l'identifiant)",
        });
      }
      if (p.city && !cityNames.has(norm(p.city))) {
        brokenLinks.push({
          type: "property",
          id: p.id,
          label: p.title,
          url: propUrl(p),
          detail: `Ville « ${p.city} » absente du registre — liens de maillage interne rompus`,
        });
      }
    }
    for (const a of articles) {
      register("article", a.id, a.title, articleUrl(a), a.metaTitle, a.metaDescription);
    }
    for (const c of cities) {
      register("city", c.id, c.name, cityUrl(c), c.metaTitle, c.metaDescription);
    }

    const duplicateTitles = findDuplicates(titled);
    const duplicateDescriptions = findDuplicates(described);

    const publishedCount = properties.length;
    const articlesCount = articles.length;
    const citiesCount = cities.length;
    const agentsCount = agentsRow?.value ?? 0;
    const imageUrlCount = mediaRows.length;

    const children = [
      { name: "Pages statiques", path: "/sitemap-static.xml", urlCount: STATIC_ROUTE_COUNT },
      { name: "Biens", path: "/sitemap-properties.xml", urlCount: publishedCount },
      { name: "Villes", path: "/sitemap-cities.xml", urlCount: citiesCount * URLS_PER_CITY },
      { name: "Agents", path: "/sitemap-agents.xml", urlCount: agentsCount },
      { name: "Blog", path: "/sitemap-blog.xml", urlCount: articlesCount + 1 },
      { name: "Images", path: "/sitemap-images.xml", urlCount: imageUrlCount },
    ].map((c) => ({ name: c.name, url: `${domain}${c.path}`, urlCount: c.urlCount, ok: c.urlCount > 0 }));

    const totalUrls = children.reduce((s, c) => s + c.urlCount, 0);

    const totalAuditable = publishedCount + articlesCount + citiesCount;
    const completePages = totalAuditable - new Set([...missingTitle, ...missingDescription].map((i) => `${i.type}:${i.id}`)).size;
    const score = totalAuditable > 0 ? Math.round((completePages / totalAuditable) * 100) : 100;
    const totalIssues =
      missingTitle.length +
      missingDescription.length +
      duplicateTitles.length +
      duplicateDescriptions.length +
      brokenLinks.length;

    res.json({
      pages: {
        known: publishedCount + articlesCount + citiesCount + agentsCount + STATIC_ROUTE_COUNT,
        properties: publishedCount,
        articles: articlesCount,
        cities: citiesCount,
        agents: agentsCount,
        staticPages: STATIC_ROUTE_COUNT,
      },
      missingTitle,
      missingDescription,
      duplicateTitles,
      duplicateDescriptions,
      brokenLinks,
      sitemap: {
        ok: totalUrls > 0,
        url: `${domain}/sitemap.xml`,
        totalUrls,
        children,
      },
      summary: { totalIssues, score },
    });
  } catch (err) {
    logger.error({ err }, "SEO audit error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /seo/google/status — connection state for Google panels.
router.get("/seo/google/status", ...staffOnly, async (_req, res) => {
  const scConnected = searchConsoleConnected();
  const gaConnected = analyticsConnected();
  res.json({
    configured: scConnected || gaConnected,
    serviceAccountEmail: getServiceAccountEmail(),
    searchConsole: { connected: scConnected, siteUrl: scConnected ? gscSiteUrl() : null },
    analytics: { connected: gaConnected, propertyId: gaConnected ? ga4PropertyId() : null },
    pageSpeed: { available: true },
  });
});

function clampDays(raw: unknown): number {
  const n = parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(n)) return 28;
  return Math.min(Math.max(n, 1), 365);
}

// GET /seo/google/search-console
router.get("/seo/google/search-console", ...staffOnly, async (req, res) => {
  try {
    const data = await fetchSearchConsole(clampDays(req.query.days));
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Search Console route error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /seo/google/analytics
router.get("/seo/google/analytics", ...staffOnly, async (req, res) => {
  try {
    const data = await fetchAnalytics(clampDays(req.query.days));
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Analytics route error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /seo/google/pagespeed?template=&strategy=
router.get("/seo/google/pagespeed", ...staffOnly, async (req, res) => {
  try {
    const template = String(req.query.template ?? "home");
    const strategy = req.query.strategy === "desktop" ? "desktop" : "mobile";
    const domain = siteDomain();

    let url: string | null = null;
    switch (template) {
      case "home":
        url = `${domain}/`;
        break;
      case "search":
        url = `${domain}/acheter`;
        break;
      case "blog":
        url = `${domain}/blog`;
        break;
      case "property": {
        const [p] = await db
          .select({ id: propertiesTable.id, slug: propertiesTable.slug })
          .from(propertiesTable)
          .where(eq(propertiesTable.status, "published"))
          .limit(1);
        url = p ? `${domain}/annonce/${p.slug ?? p.id}` : null;
        break;
      }
      case "city": {
        const [c] = await db
          .select({ slug: citiesTable.slug })
          .from(citiesTable)
          .orderBy(asc(citiesTable.displayOrder))
          .limit(1);
        url = c ? `${domain}/immobilier-${c.slug}` : null;
        break;
      }
      default:
        url = `${domain}/`;
    }

    if (!url) {
      res.json({
        available: false,
        template,
        strategy,
        url: null,
        error: "Aucun contenu publié pour ce modèle de page",
        source: null,
        scores: { performance: null, seo: null, accessibility: null, bestPractices: null },
        coreWebVitals: { lcp: null, cls: null, inp: null, fcp: null, ttfb: null },
      });
      return;
    }

    const result = await fetchPageSpeed(template, url, strategy);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "PageSpeed route error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
