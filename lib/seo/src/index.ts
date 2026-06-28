// Shared SEO helpers used by the API, the seed/prerender scripts and the
// frontend. Keep this dependency-free (no node/browser-only APIs) so it works
// in every environment.

const ACCENTS: Record<string, string> = {
  à: "a", â: "a", ä: "a", á: "a", ã: "a", å: "a",
  ç: "c",
  è: "e", é: "e", ê: "e", ë: "e",
  ì: "i", í: "i", î: "i", ï: "i",
  ñ: "n",
  ò: "o", ó: "o", ô: "o", ö: "o", õ: "o",
  ù: "u", ú: "u", û: "u", ü: "u",
  ý: "y", ÿ: "y",
  œ: "oe", æ: "ae",
};

/** Turn any French text into a clean, URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[àâäáãåçèéêëìíîïñòóôöõùúûüýÿœæ]/g, (c) => ACCENTS[c] ?? c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Build the canonical SEO slug for a property listing. */
export function buildPropertySlug(p: {
  id: number;
  type: string;
  city: string;
  rooms?: number | null;
  livingArea?: number | null;
}): string {
  const typeWord = PROPERTY_TYPE_FR[p.type] ?? p.type;
  const parts = [typeWord, p.city];
  if (p.rooms) parts.push(`${p.rooms}-pieces`);
  else if (p.livingArea) parts.push(`${Math.round(p.livingArea)}-m2`);
  parts.push(String(p.id));
  return slugify(parts.join("-"));
}

/** Build a deterministic, reversible agent slug (id is the trailing segment). */
export function buildAgentSlug(a: { id: number; firstName: string; lastName: string }): string {
  return `${slugify(`${a.firstName}-${a.lastName}`)}-${a.id}`;
}

/** Extract the trailing numeric id from a slug like `marie-laurent-3`. */
export function idFromSlug(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  return m ? parseInt(m[1]!, 10) : null;
}

// French labels for property types (singular).
export const PROPERTY_TYPE_FR: Record<string, string> = {
  apartment: "appartement",
  house: "maison",
  villa: "villa",
  land: "terrain",
  commercial: "local-commercial",
  garage: "garage",
  building: "immeuble",
  programme: "programme-neuf",
  other: "bien",
};

// Reverse map: slug word → property type enum.
export const FR_TO_PROPERTY_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_FR).map(([k, v]) => [v, k]),
);

export interface JsonLd {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

export interface OrgInfo {
  name: string;
  url: string;
  logoUrl: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  region?: string;
  country?: string;
}

export function realEstateAgentJsonLd(org: OrgInfo): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: org.name,
    url: org.url,
    logo: org.logoUrl,
    image: org.logoUrl,
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(org.email ? { email: org.email } : {}),
    address: {
      "@type": "PostalAddress",
      ...(org.street ? { streetAddress: org.street } : {}),
      ...(org.city ? { addressLocality: org.city } : {}),
      ...(org.postalCode ? { postalCode: org.postalCode } : {}),
      ...(org.region ? { addressRegion: org.region } : {}),
      addressCountry: org.country ?? "FR",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export interface ResidenceInfo {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
  price?: number | null;
  priceCurrency?: string;
  city: string;
  postalCode: string;
  region?: string | null;
  livingArea?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function residenceJsonLd(r: ResidenceInfo): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: r.name,
    url: r.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: r.city,
      postalCode: r.postalCode,
      ...(r.region ? { addressRegion: r.region } : {}),
      addressCountry: "FR",
    },
  };
  if (r.description) ld.description = r.description;
  if (r.image) ld.image = r.image;
  if (r.livingArea) ld.floorSize = { "@type": "QuantitativeValue", value: r.livingArea, unitCode: "MTK" };
  if (r.rooms) ld.numberOfRooms = r.rooms;
  if (r.bedrooms) ld.numberOfBedrooms = r.bedrooms;
  if (r.latitude != null && r.longitude != null) {
    ld.geo = { "@type": "GeoCoordinates", latitude: r.latitude, longitude: r.longitude };
  }
  if (r.price) {
    ld.offers = {
      "@type": "Offer",
      price: r.price,
      priceCurrency: r.priceCurrency ?? "EUR",
      availability: "https://schema.org/InStock",
    };
  }
  return ld;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: FaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

export function itemListJsonLd(urls: string[], name?: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: urls.length,
    itemListElement: urls.map((url, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url,
    })),
  };
}

export function personJsonLd(p: {
  name: string;
  url: string;
  jobTitle?: string | null;
  image?: string | null;
  telephone?: string | null;
  email?: string | null;
  worksFor?: string | null;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: p.url,
  };
  if (p.jobTitle) ld.jobTitle = p.jobTitle;
  if (p.image) ld.image = p.image;
  if (p.telephone) ld.telephone = p.telephone;
  if (p.email) ld.email = p.email;
  if (p.worksFor) ld.worksFor = { "@type": "Organization", name: p.worksFor };
  return ld;
}
