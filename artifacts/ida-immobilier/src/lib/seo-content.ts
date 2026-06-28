// Shared constants + copy generators for the programmatic SEO pages.
import { COMPANY } from "@/data/legal";
import { PROPERTY_TYPE_FR } from "@workspace/seo";
import type { AreaStats } from "@workspace/api-client-react";

export const SITE_URL = "https://ida-immobilier.com";

export const ORG = {
  name: COMPANY.name,
  url: SITE_URL,
  logoUrl: `${SITE_URL}/logo.png`,
  phone: COMPANY.phoneHref,
  email: COMPANY.email,
  street: COMPANY.address,
  city: COMPANY.city,
  postalCode: COMPANY.postalCode,
  region: "Provence-Alpes-Côte d'Azur",
  country: "FR",
} as const;

export const eur = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n);

// Plural French label for a property type, e.g. "appartements".
const TYPE_PLURAL: Record<string, string> = {
  apartment: "appartements",
  house: "maisons",
  villa: "villas",
  land: "terrains",
  commercial: "locaux commerciaux",
  building: "immeubles",
  programme: "programmes neufs",
  garage: "garages",
  other: "biens",
};

export const typePlural = (type: string): string => TYPE_PLURAL[type] ?? "biens";
export const typeSingular = (type: string): string => PROPERTY_TYPE_FR[type]?.replace(/-/g, " ") ?? "bien";

export interface FaqEntry {
  question: string;
  answer: string;
}

// Generates a small, data-driven FAQ for a city page. Falls back gracefully
// when stats are sparse so the copy never reads as broken.
export function cityFaq(cityName: string, stats: AreaStats): FaqEntry[] {
  const faq: FaqEntry[] = [];
  if (stats.avgPricePerM2) {
    faq.push({
      question: `Quel est le prix moyen au m² à ${cityName} ?`,
      answer: `D'après les biens actuellement proposés par I.D.A Immobilier, le prix moyen constaté à ${cityName} est d'environ ${eur(stats.avgPricePerM2)} le m². Ce chiffre varie selon le quartier, l'état du bien et ses prestations. Pour une estimation précise de votre bien, nos conseillers réalisent une évaluation gratuite et personnalisée.`,
    });
  }
  if (stats.avgSalePrice) {
    faq.push({
      question: `Quel budget prévoir pour acheter à ${cityName} ?`,
      answer: `Le prix de vente moyen des biens I.D.A Immobilier à ${cityName} s'établit autour de ${eur(stats.avgSalePrice)}. Notre équipe vous accompagne pour trouver le bien correspondant à votre budget et négocier dans les meilleures conditions.`,
    });
  }
  faq.push({
    question: `Pourquoi choisir I.D.A Immobilier à ${cityName} ?`,
    answer: `Implantée à Marignane au cœur de la Provence, I.D.A Immobilier connaît parfaitement le marché de ${cityName} et de ses environs. Nous proposons un accompagnement sur-mesure pour l'achat, la vente, la location et l'estimation de votre bien.`,
  });
  return faq;
}
