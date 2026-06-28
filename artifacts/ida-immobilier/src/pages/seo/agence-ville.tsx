import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  useGetCityDetail,
  getGetCityDetailQueryKey,
  useListProperties,
  getListPropertiesQueryKey,
} from "@workspace/api-client-react";
import {
  breadcrumbJsonLd,
  realEstateAgentJsonLd,
  itemListJsonLd,
} from "@workspace/seo";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import { Breadcrumbs, StatsBar, NearbyCities } from "@/components/seo/seo-blocks";
import { ORG, SITE_URL } from "@/lib/seo-content";
import { COMPANY } from "@/data/legal";
import NotFound from "@/pages/not-found";

export default function AgenceVille({ slug }: { slug: string }) {
  const { data: detail, isLoading } = useGetCityDetail(slug, {
    query: { enabled: !!slug, queryKey: getGetCityDetailQueryKey(slug) },
  });
  const propsParams = { status: "published", city: detail?.city.name, limit: 6 } as any;
  const { data: propsResp } = useListProperties(propsParams, {
    query: { enabled: !!detail?.city.name, queryKey: getListPropertiesQueryKey(propsParams) },
  });
  const properties = propsResp?.data ?? [];
  const city = detail?.city;
  const url = city ? `${SITE_URL}/agence-immobiliere-${city.slug}` : SITE_URL;

  useSeo({
    title: city ? `Agence immobilière à ${city.name} — I.D.A Immobilier` : undefined,
    description: city
      ? `I.D.A Immobilier, votre agence immobilière à ${city.name} et dans toute la Provence. Achat, vente, location et estimation gratuite. Contactez nos conseillers experts.`
      : undefined,
    canonical: url,
  });

  useJsonLd(
    city
      ? [
          realEstateAgentJsonLd({ ...ORG, url }),
          breadcrumbJsonLd([
            { name: "Accueil", url: `${SITE_URL}/` },
            { name: `Immobilier à ${city.name}`, url: `${SITE_URL}/immobilier-${city.slug}` },
            { name: `Agence à ${city.name}`, url },
          ]),
          itemListJsonLd(properties.map((p) => `${SITE_URL}/annonce/${p.slug ?? p.id}`)),
        ]
      : null,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-10 w-1/2 bg-muted animate-pulse rounded mb-6" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!city) return <NotFound />;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 space-y-12">
        <Breadcrumbs
          items={[
            { name: "Accueil", href: "/" },
            { name: `Immobilier à ${city.name}`, href: `/immobilier-${city.slug}` },
            { name: `Agence à ${city.name}` },
          ]}
        />

        <header className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            Agence immobilière à {city.name}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {city.sellingAdvice ??
              `I.D.A Immobilier accompagne les acheteurs, vendeurs et locataires à ${city.name} et dans ses environs. Notre connaissance fine du marché local et notre approche sur-mesure font la différence à chaque étape de votre projet immobilier.`}
          </p>
        </header>

        {detail && <StatsBar stats={detail.stats} />}

        <section className="bg-card border border-border rounded-2xl p-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
              Contactez votre conseiller
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-accent" />
                {COMPANY.address}, {COMPANY.postalCode} {COMPANY.city}
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accent" />
                <a href={`tel:${COMPANY.phoneHref}`} className="hover:text-primary">
                  {COMPANY.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                  {COMPANY.email}
                </a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/contact">
                <Button className="bg-primary text-primary-foreground">Nous contacter</Button>
              </Link>
              <Link href={`/estimation-immobiliere-${city.slug}`}>
                <Button variant="outline" className="border-primary text-primary">
                  Estimation gratuite
                </Button>
              </Link>
            </div>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {city.buyingAdvice ??
              `Que vous souhaitiez acheter, vendre ou louer à ${city.name}, nos conseillers vous guident avec rigueur et discrétion. Estimation offerte, diffusion premium de votre annonce et accompagnement jusqu'à la signature.`}
          </div>
        </section>

        {properties.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-semibold text-primary mb-6">
              Nos dernières annonces à {city.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            <div className="mt-6">
              <Link href={`/immobilier-${city.slug}`}>
                <Button variant="outline" className="border-primary text-primary">
                  Voir tous les biens à {city.name}
                </Button>
              </Link>
            </div>
          </section>
        )}

        <NearbyCities cities={detail?.nearby ?? []} heading="Nos agences à proximité" />
      </div>
    </div>
  );
}
