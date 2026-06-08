/**
 * Prerender script — bakes route-specific metadata into the initial HTML.
 *
 * Run after `vite build`:
 *   tsx ./src/prerender.ts [distPublicDir]
 *
 * For every static public route it generates a dedicated index.html under
 * dist/public/<route>/index.html with the correct <title>, meta description,
 * canonical, Open Graph, Twitter, robots and JSON-LD in the <head> —
 * all visible to crawlers that do not execute JavaScript.
 *
 * If DATABASE_URL is set it also generates per-property pages for all
 * published listings, fixing the dynamic /annonce/:id metadata issue.
 */

import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://ida-immobilier.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph.jpg`;
const ROBOTS_INDEX =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const ROBOTS_NOINDEX = "noindex, nofollow";

// ─── Static route metadata ────────────────────────────────────────────────────

interface RouteConfig {
  path: string;
  title: string;
  description: string;
  canonical: string;
  noIndex?: boolean;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
}

const STATIC_ROUTES: RouteConfig[] = [
  {
    path: "/",
    title: "I.D.A Immobilier | Agence Immobilière de Prestige en Provence",
    description:
      "Découvrez les biens d'exception I.D.A Immobilier à Marignane, Marseille, Aix-en-Provence. Vente, location, estimation — votre expert immobilier en Provence-Alpes-Côte d'Azur.",
    canonical: `${BASE_URL}/`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "I.D.A Immobilier",
      url: BASE_URL,
      description:
        "Agence immobilière de prestige à Marignane, Provence. Achat, vente, location et estimation de biens d'exception.",
    },
  },
  {
    path: "/acheter",
    title: "Acheter un bien immobilier en Provence | I.D.A Immobilier",
    description:
      "Parcourez nos annonces de vente : appartements, maisons, villas et terrains à Marignane, Aix-en-Provence, Marseille et dans tout le Var. Trouvez le bien de vos rêves avec I.D.A Immobilier.",
    canonical: `${BASE_URL}/acheter`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Acheter", item: `${BASE_URL}/acheter` },
      ],
    },
  },
  {
    path: "/louer",
    title: "Louer un bien immobilier en Provence | I.D.A Immobilier",
    description:
      "Découvrez nos annonces de location : appartements, maisons, villas à Marignane, Aix-en-Provence, Marseille. Loyer, charges, dépôt de garantie — I.D.A Immobilier vous accompagne.",
    canonical: `${BASE_URL}/louer`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Louer", item: `${BASE_URL}/louer` },
      ],
    },
  },
  {
    path: "/estimation",
    title: "Estimation gratuite de votre bien immobilier | I.D.A Immobilier",
    description:
      "Obtenez une estimation gratuite et instantanée de votre bien en Provence. Appartement, maison, villa — I.D.A Immobilier évalue votre patrimoine en quelques minutes.",
    canonical: `${BASE_URL}/estimation`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Estimation", item: `${BASE_URL}/estimation` },
      ],
    },
  },
  {
    path: "/contact",
    title: "Contact — I.D.A Immobilier Marignane | I.D.A Immobilier",
    description:
      "Contactez I.D.A Immobilier au 16 av de la 1ère armée française, Marignane (13700). Tél : +33 6 66 37 17 37. Nos experts répondent à toutes vos questions immobilières.",
    canonical: `${BASE_URL}/contact`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Contact", item: `${BASE_URL}/contact` },
      ],
    },
  },
  {
    path: "/nos-agences",
    title: "Nos Agences en Provence — I.D.A Immobilier | I.D.A Immobilier",
    description:
      "Retrouvez les agences I.D.A Immobilier en Provence. Experts locaux de l'immobilier de prestige à Marignane et dans les Bouches-du-Rhône.",
    canonical: `${BASE_URL}/nos-agences`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Nos agences", item: `${BASE_URL}/nos-agences` },
      ],
    },
  },
  {
    path: "/programmes-neufs",
    title: "Programmes neufs en Provence — I.D.A Immobilier | I.D.A Immobilier",
    description:
      "Découvrez nos programmes immobiliers neufs à Marignane, Aix-en-Provence et dans les Bouches-du-Rhône. Avantages fiscaux, garanties constructeur, normes RE2020.",
    canonical: `${BASE_URL}/programmes-neufs`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Programmes neufs",
          item: `${BASE_URL}/programmes-neufs`,
        },
      ],
    },
  },
  {
    path: "/a-propos",
    title: "À propos de I.D.A Immobilier — Notre histoire | I.D.A Immobilier",
    description:
      "Fondée à Marignane, I.D.A Immobilier est votre agence de confiance pour l'immobilier de prestige en Provence. Excellence, proximité et expertise depuis plus de 15 ans.",
    canonical: `${BASE_URL}/a-propos`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "À propos", item: `${BASE_URL}/a-propos` },
      ],
    },
  },
  // ─── Legal pages — noindex ──────────────────────────────────────────────────
  {
    path: "/mentions-legales",
    title: "Mentions légales | I.D.A Immobilier",
    description:
      "Mentions légales de I.D.A Immobilier, agence immobilière à Marignane (13700) : éditeur, hébergeur, carte professionnelle (loi Hoguet), médiation et propriété intellectuelle.",
    canonical: `${BASE_URL}/mentions-legales`,
    noIndex: true,
  },
  {
    path: "/confidentialite",
    title: "Politique de confidentialité | I.D.A Immobilier",
    description:
      "Politique de confidentialité de I.D.A Immobilier : données collectées, finalités, droits RGPD, conservation et sécurité de vos informations personnelles.",
    canonical: `${BASE_URL}/confidentialite`,
    noIndex: true,
  },
  {
    path: "/cgu",
    title: "Conditions générales d'utilisation | I.D.A Immobilier",
    description:
      "Conditions générales d'utilisation du site I.D.A Immobilier : accès, espace client, propriété intellectuelle, responsabilité et droit applicable.",
    canonical: `${BASE_URL}/cgu`,
    noIndex: true,
  },
  {
    path: "/honoraires",
    title: "Barème des honoraires | I.D.A Immobilier",
    description:
      "Barème des honoraires de l'agence I.D.A Immobilier pour les transactions, locations et gestion locative, conformément à la réglementation en vigueur.",
    canonical: `${BASE_URL}/honoraires`,
    noIndex: true,
  },
];

// ─── HTML head rewriting ──────────────────────────────────────────────────────

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface HeadOpts {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogType: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  jsonLd?: Record<string, unknown>;
}

function rewriteHead(html: string, opts: HeadOpts): string {
  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(opts.title)}</title>`);

  out = out.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.description)}$2`,
  );
  out = out.replace(
    /(<meta\s+name="robots"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.robots)}$2`,
  );
  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${escapeAttr(opts.canonical)}$2`,
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="fr-FR"\s+href=")[^"]*(")/,
    `$1${escapeAttr(opts.canonical)}$2`,
  );

  out = out.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.ogTitle)}$2`,
  );
  out = out.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.ogDescription)}$2`,
  );
  out = out.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.ogUrl)}$2`,
  );
  out = out.replace(
    /(<meta\s+property="og:type"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.ogType)}$2`,
  );
  out = out.replace(
    /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.ogImage)}$2`,
  );

  out = out.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.twitterTitle)}$2`,
  );
  out = out.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.twitterDescription)}$2`,
  );
  out = out.replace(
    /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/,
    `$1${escapeAttr(opts.twitterImage)}$2`,
  );

  if (opts.jsonLd) {
    const jsonLdScript = `\n    <script id="page-json-ld" type="application/ld+json">\n    ${JSON.stringify(opts.jsonLd)}\n    </script>`;
    out = out.replace("</head>", `${jsonLdScript}\n  </head>`);
  }

  return out;
}

// ─── Write file helper ────────────────────────────────────────────────────────

function writeHtml(distPublic: string, routePath: string, html: string): void {
  const dir =
    routePath === "/" ? distPublic : path.join(distPublic, routePath.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

// ─── Type / price helpers (mirrors annonce.tsx) ───────────────────────────────

const TYPE_LABEL_MAP: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  land: "Terrain",
  commercial: "Local commercial",
  garage: "Garage",
  building: "Immeuble",
  programme: "Programme neuf",
  other: "Bien immobilier",
};

function formatPrice(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const distPublic =
    process.argv[2] ??
    path.resolve(import.meta.dirname, "../../artifacts/ida-immobilier/dist/public");

  const templatePath = path.join(distPublic, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error(`[prerender] index.html not found at ${templatePath}`);
    console.error("[prerender] Run `vite build` first.");
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  console.log(`[prerender] Template loaded: ${templatePath}`);

  // ── Static routes ────────────────────────────────────────────────────────────
  let staticCount = 0;
  for (const route of STATIC_ROUTES) {
    const robots = route.noIndex ? ROBOTS_NOINDEX : ROBOTS_INDEX;
    const html = rewriteHead(template, {
      title: route.title,
      description: route.description,
      canonical: route.canonical,
      robots,
      ogTitle: route.title,
      ogDescription: route.description,
      ogUrl: route.canonical,
      ogType: route.ogType ?? "website",
      ogImage: DEFAULT_OG_IMAGE,
      twitterTitle: route.title,
      twitterDescription: route.description,
      twitterImage: DEFAULT_OG_IMAGE,
      jsonLd: route.jsonLd,
    });

    writeHtml(distPublic, route.path, html);
    staticCount++;
    console.log(`[prerender] ✓ ${route.path}`);
  }
  console.log(`[prerender] Static routes done (${staticCount}).`);

  // ── Dynamic property pages ────────────────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    console.log("[prerender] DATABASE_URL not set — skipping property pages.");
    return;
  }

  let propertyCount = 0;
  try {
    const { db, propertiesTable, propertyMediaTable } = await import("@workspace/db");
    const { eq, and } = await import("drizzle-orm");

    const properties = await db
      .select({
        id: propertiesTable.id,
        title: propertiesTable.title,
        type: propertiesTable.type,
        city: propertiesTable.city,
        postalCode: propertiesTable.postalCode,
        address: propertiesTable.address,
        region: propertiesTable.region,
        rooms: propertiesTable.rooms,
        bedrooms: propertiesTable.bedrooms,
        livingArea: propertiesTable.livingArea,
        salePrice: propertiesTable.salePrice,
        rentalPrice: propertiesTable.rentalPrice,
        latitude: propertiesTable.latitude,
        longitude: propertiesTable.longitude,
        metaTitle: propertiesTable.metaTitle,
        metaDescription: propertiesTable.metaDescription,
      })
      .from(propertiesTable)
      .where(eq(propertiesTable.status, "published"));

    for (const property of properties) {
      const salePrice = property.salePrice ? parseFloat(property.salePrice) : null;
      const rentalPrice = property.rentalPrice ? parseFloat(property.rentalPrice) : null;
      const price = salePrice ?? rentalPrice;

      // Fetch main image (first photo by order)
      const [mainMedia] = await db
        .select({ url: propertyMediaTable.url, watermarkedUrl: propertyMediaTable.watermarkedUrl })
        .from(propertyMediaTable)
        .where(
          and(
            eq(propertyMediaTable.propertyId, property.id),
            eq(propertyMediaTable.type, "photo"),
          ),
        )
        .orderBy(propertyMediaTable.order)
        .limit(1);

      const mainImageUrl = mainMedia
        ? (mainMedia.watermarkedUrl ?? mainMedia.url)
        : null;

      const typeLabel = TYPE_LABEL_MAP[property.type ?? ""] ?? "Bien immobilier";
      const title =
        property.metaTitle ??
        `${typeLabel}${property.rooms ? ` ${property.rooms} pièces` : ""} à ${property.city}${price ? ` — ${formatPrice(price)}` : ""} | I.D.A Immobilier`;
      const description =
        property.metaDescription ??
        `${typeLabel}${property.livingArea ? ` de ${property.livingArea} m²` : ""}${property.rooms ? `, ${property.rooms} pièces` : ""}${property.bedrooms ? `, ${property.bedrooms} chambre${property.bedrooms > 1 ? "s" : ""}` : ""} à ${property.city} (${property.postalCode}).${price ? ` Prix\u00a0: ${formatPrice(price)}${rentalPrice ? "/mois" : ""}.` : ""} I.D.A Immobilier — agence immobilière de prestige en Provence.`;

      const canonical = `${BASE_URL}/annonce/${property.id}`;
      const ogImage = mainImageUrl ?? DEFAULT_OG_IMAGE;

      const jsonLd: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description,
        url: canonical,
        ...(mainImageUrl ? { image: [mainImageUrl] } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address,
          addressLocality: property.city,
          postalCode: property.postalCode,
          addressRegion: property.region ?? "Bouches-du-Rhône",
          addressCountry: "FR",
        },
        ...(property.latitude && property.longitude
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: property.latitude,
                longitude: property.longitude,
              },
            }
          : {}),
        ...(price
          ? {
              offers: {
                "@type": "Offer",
                price,
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
        ...(property.livingArea
          ? {
              floorSize: {
                "@type": "QuantitativeValue",
                value: property.livingArea,
                unitCode: "MTK",
              },
            }
          : {}),
        ...(property.rooms ? { numberOfRooms: property.rooms } : {}),
        ...(property.bedrooms ? { numberOfBedrooms: property.bedrooms } : {}),
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: rentalPrice ? "Louer" : "Acheter",
              item: rentalPrice ? `${BASE_URL}/louer` : `${BASE_URL}/acheter`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: property.title,
              item: canonical,
            },
          ],
        },
      };

      const html = rewriteHead(template, {
        title,
        description,
        canonical,
        robots: ROBOTS_INDEX,
        ogTitle: title,
        ogDescription: description,
        ogUrl: canonical,
        ogType: "article",
        ogImage,
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
        jsonLd,
      });

      writeHtml(distPublic, `/annonce/${property.id}`, html);
      propertyCount++;
    }

    console.log(`[prerender] Property pages done (${propertyCount}).`);

    // Close the DB pool so the process exits cleanly
    const { pool } = await import("@workspace/db");
    await pool.end();
  } catch (err) {
    console.error("[prerender] DB query failed — property pages skipped.", err);
  }

  console.log(
    `[prerender] Done. Total: ${staticCount} static + ${propertyCount} property pages.`,
  );
}

main().catch((err) => {
  console.error("[prerender] Fatal error:", err);
  process.exit(1);
});
