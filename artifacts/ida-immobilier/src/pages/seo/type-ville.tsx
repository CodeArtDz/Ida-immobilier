import { useMemo } from "react";
import { Link } from "wouter";
import {
  useGetCityDetail,
  getGetCityDetailQueryKey,
  useGetAreaStats,
  getGetAreaStatsQueryKey,
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
import { Breadcrumbs, StatsBar, LinkGrid } from "@/components/seo/seo-blocks";
import { ORG, SITE_URL, typePlural, typeSingular } from "@/lib/seo-content";
import { PROPERTY_TYPE_FR } from "@workspace/seo";
import NotFound from "@/pages/not-found";

const OTHER_TYPES = ["apartment", "house", "villa", "land"] as const;

export default function TypeVille({ type, slug }: { type: string; slug: string }) {
  const { data: detail, isLoading } = useGetCityDetail(slug, {
    query: { enabled: !!slug, queryKey: getGetCityDetailQueryKey(slug) },
  });
  const city = detail?.city;

  const statsParams = { city: city?.name, type } as any;
  const { data: stats } = useGetAreaStats(statsParams, {
    query: { enabled: !!city?.name, queryKey: getGetAreaStatsQueryKey(statsParams) },
  });
  const propsParams = { status: "published", city: city?.name, type, limit: 24 } as any;
  const { data: propsResp, isLoading: propsLoading } = useListProperties(propsParams, {
    query: { enabled: !!city?.name, queryKey: getListPropertiesQueryKey(propsParams) },
  });

  const properties = (propsResp?.data ?? []).filter((p) => !p.rentalPrice);
  const plural = typePlural(type);
  const url = city ? `${SITE_URL}/${PROPERTY_TYPE_FR[type]}-a-vendre-${city.slug}` : SITE_URL;

  useSeo({
    title: city ? `${cap(plural)} à vendre à ${city.name}` : undefined,
    description: city
      ? `Découvrez nos ${plural} à vendre à ${city.name} avec I.D.A Immobilier. Annonces exclusives, photos détaillées et accompagnement personnalisé pour votre achat.`
      : undefined,
    canonical: url,
  });

  useJsonLd(
    city
      ? [
          realEstateAgentJsonLd(ORG),
          breadcrumbJsonLd([
            { name: "Accueil", url: `${SITE_URL}/` },
            { name: `Immobilier à ${city.name}`, url: `${SITE_URL}/immobilier-${city.slug}` },
            { name: `${cap(plural)} à vendre`, url },
          ]),
          itemListJsonLd(
            properties.map((p) => `${SITE_URL}/annonce/${p.slug ?? p.id}`),
            `${cap(plural)} à ${city.name}`,
          ),
        ]
      : null,
  );

  const otherLinks = useMemo(
    () =>
      city
        ? OTHER_TYPES.filter((t) => t !== type).map((t) => ({
            label: `${cap(typePlural(t))} à vendre à ${city.name}`,
            href: `/${PROPERTY_TYPE_FR[t]}-a-vendre-${city.slug}`,
          }))
        : [],
    [city, type],
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
            { name: `${cap(plural)} à vendre` },
          ]}
        />

        <header className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            {cap(plural)} à vendre à {city.name}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Parcourez notre sélection de {plural} à vendre à {city.name}. I.D.A
            Immobilier vous accompagne dans la recherche du {typeSingular(type)} qui
            vous correspond.
          </p>
        </header>

        {stats && <StatsBar stats={stats} />}

        <section>
          {propsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground mb-4">
                Aucun {typeSingular(type)} disponible à {city.name} pour le moment.
              </p>
              <Link href={`/immobilier-${city.slug}`}>
                <Button variant="outline" className="border-primary text-primary">
                  Voir tous les biens à {city.name}
                </Button>
              </Link>
            </div>
          )}
        </section>

        <LinkGrid heading={`Autres recherches à ${city.name}`} links={otherLinks} />
      </div>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
