import { useEffect } from "react";

const DEFAULT_TITLE = "I.D.A Immobilier | Agence Immobilière de Prestige en Provence";
const DEFAULT_DESC =
  "I.D.A Immobilier, agence immobilière de luxe basée à Marignane (13700), Provence. Achat, vente, location et estimation de biens d'exception en Provence-Alpes-Côte d'Azur.";
const BASE_URL = "https://ida-immobilier.com";

function setMeta(selector: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const inner = selector.slice(1, -1);
    const eqIdx = inner.indexOf("=");
    const attr = inner.slice(0, eqIdx);
    const val = inner.slice(eqIdx + 2, -1);
    el.setAttribute(attr, val);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}

export function useSeo({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | I.D.A Immobilier` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const canonicalUrl = canonical || BASE_URL + "/";

    document.title = fullTitle;
    setMeta('meta[name="description"]', desc);
    setMeta(
      'meta[name="robots"]',
      noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    setCanonical(canonicalUrl);

    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:type"]', ogType);
    if (ogImage) {
      setMeta('meta[property="og:image"]', ogImage);
      setMeta('meta[name="twitter:image"]', ogImage);
    }

    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', desc);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('meta[name="description"]', DEFAULT_DESC);
      setMeta(
        'meta[name="robots"]',
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      );
      setCanonical(BASE_URL + "/");
      setMeta('meta[property="og:title"]', DEFAULT_TITLE);
      setMeta('meta[property="og:description"]', DEFAULT_DESC);
      setMeta('meta[property="og:url"]', BASE_URL + "/");
      setMeta('meta[property="og:type"]', "website");
      setMeta('meta[name="twitter:title"]', DEFAULT_TITLE);
      setMeta('meta[name="twitter:description"]', DEFAULT_DESC);
    };
  }, [title, description, canonical, ogImage, ogType, noIndex]);
}
