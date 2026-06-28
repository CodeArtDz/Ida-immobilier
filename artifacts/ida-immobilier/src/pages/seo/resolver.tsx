import { FR_TO_PROPERTY_TYPE } from "@workspace/seo";
import Ville from "@/pages/seo/ville";
import AgenceVille from "@/pages/seo/agence-ville";
import EstimationVille from "@/pages/seo/estimation-ville";
import TypeVille from "@/pages/seo/type-ville";
import NotFound from "@/pages/not-found";

// Single-segment SEO slugs all share the `/` namespace, e.g.
//   /immobilier-aix-en-provence        → city / postal landing
//   /agence-immobiliere-marignane      → agency-in-city landing
//   /estimation-immobiliere-vitrolles  → estimation-in-city landing
//   /appartement-a-vendre-marseille    → type × city listing
// City slugs themselves can contain hyphens, so we match on known prefixes /
// the `-a-vendre-` infix rather than naive splitting.
export default function SeoResolver({ slug }: { slug: string }) {
  if (slug.startsWith("immobilier-")) {
    return <Ville identifier={slug.slice("immobilier-".length)} />;
  }
  if (slug.startsWith("agence-immobiliere-")) {
    return <AgenceVille slug={slug.slice("agence-immobiliere-".length)} />;
  }
  if (slug.startsWith("estimation-immobiliere-")) {
    return <EstimationVille slug={slug.slice("estimation-immobiliere-".length)} />;
  }

  const typeMatch = slug.match(/^(.+?)-a-vendre-(.+)$/);
  if (typeMatch) {
    const typeWord = typeMatch[1]!;
    const citySlug = typeMatch[2]!;
    const type = FR_TO_PROPERTY_TYPE[typeWord];
    if (type) return <TypeVille type={type} slug={citySlug} />;
  }

  return <NotFound />;
}
