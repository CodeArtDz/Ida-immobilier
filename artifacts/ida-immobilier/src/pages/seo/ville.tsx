import { useMemo } from "react";
import { Link } from "wouter";
import {
  useListCities,
  useGetCityDetail,
  getGetCityDetailQueryKey,
  useListProperties,
  getListPropertiesQueryKey,
} from "@workspace/api-client-react";
import {
  breadcrumbJsonLd,
  realEstateAgentJsonLd,
  faqJsonLd,
  itemListJsonLd,
  PROPERTY_TYPE_FR,
} from "@workspace/seo";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import {
  Breadcrumbs,
  StatsBar,
  NearbyCities,
  LinkGrid,
  FaqSection,
} from "@/components/seo/seo-blocks";
import { ORG, SITE_URL, cityFaq } from "@/lib/seo-content";
import NotFound from "@/pages/not-found";

const TYPES_FOR_LINKS = ["apartment", "house", "villa", "land"] as const;

export default function Ville({ identifier }: { identifier: string }) {
  const isPostal = /^\d{4,5}$/.test(identifier);
  const { data: cities, isLoading: citiesLoading } = useListCities();

  const slug = useMemo(() => {
    if (!isPostal) return identifier;
    const match = cities?.find((c) =>
      c.postalCodes.split(",").map((p) => p.trim()).includes(identifier),
    );
    return match?.slug;
  }, [cities, identifier, isPostal]);

  const { data: detail, isLoading: detailLoading } = useGetCityDetail(slug ?? "", {
    query: { enabled: !!slug, queryKey: getGetCityDetailQueryKey(slug ?? "") },
  });

  const propsParams = {
    status: "published",
    city: detail?.city.name,
    limit: 24,
  } as any;
  const { data: propsResp, isLoading: propsLoading } = useListProperties(propsParams, {
    query: { enabled: !!detail?.city.name, queryKey: getListPropertiesQueryKey(propsParams) },
  });

  const properties = propsResp?.data ?? [];
  const city = detail?.city;
  const url = city ? `${SITE_URL}/immobilier-${city.slug}` : SITE_URL;

  const faq = useMemo(
    () => (city && detail ? cityFaq(city.name, detail.stats) : []),
    [city, detail],
  );

  useSeo({
    title: city?.metaTitle ?? (city ? `Immobilier à ${city.name} — Achat, Vente, Location` : undefined),
    description:
      city?.metaDescription ??
      (city
        ? `Découvrez tous les biens immobiliers à ${city.name} avec I.D.A Immobilier : appartements, maisons et villas à vendre ou à louer. Estimation gratuite et accompagnement sur-mesure.`
        : undefined),
    canonical: url,
    ogImage: city?.heroImageUrl ?? undefined,
  });

  useJsonLd(
    city && detail
      ? [
          realEstateAgentJsonLd(ORG),
          breadcrumbJsonLd([
            { name: "Accueil", url: `${SITE_URL}/` },
            { name: `Immobilier à ${city.name}`, url },
          ]),
          faqJsonLd(faq),
          itemListJsonLd(
            properties.map((p) => `${SITE_URL}/annonce/${p.id}`),
            `Biens à ${city.name}`,
          ),
        ]
      : null,
  );

  if (citiesLoading || detailLoading || (isPostal && !slug && citiesLoading)) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-10 w-1/2 bg-muted animate-pulse rounded mb-6" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!city) return <NotFound />;

  const typeLinks = TYPES_FOR_LINKS.map((t) => ({
    label: `${PROPERTY_TYPE_FR[t]?.replace(/-/g, " ")} à vendre à ${city.name}`,
    href: `/${PROPERTY_TYPE_FR[t]}-a-vendre-${city.slug}`,
  }));

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 space-y-12">
        <Breadcrumbs
          items={[
            { name: "Accueil", href: "/" },
            { name: `Immobilier à ${city.name}` },
          ]}
        />

        <header className="max-w-3xl">
          <p className="text-accent text-sm uppercase tracking-widest mb-2">
            {city.department} — {city.region}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4 capitalize">
            Immobilier à {city.name}
          </h1>
          {city.intro && (
            <p className="text-muted-foreground leading-relaxed">{city.intro}</p>
          )}
        </header>

        {detail && <StatsBar stats={detail.stats} />}

        <div className="flex flex-wrap gap-3">
          <Link href={`/agence-immobiliere-${city.slug}`}>
            <Button className="bg-primary text-primary-foreground">
              Notre agence à {city.name}
            </Button>
          </Link>
          <Link href={`/estimation-immobiliere-${city.slug}`}>
            <Button variant="outline" className="border-primary text-primary">
              Estimer mon bien à {city.name}
            </Button>
          </Link>
        </div>

        {(city.marketContext || city.livingThere) && (
          <div className="grid md:grid-cols-2 gap-8">
            {city.marketContext && (
              <section>
                <h2 className="font-serif text-2xl font-semibold text-primary mb-3">
                  Le marché immobilier à {city.name}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {city.marketContext}
                </p>
              </section>
            )}
            {city.livingThere && (
              <section>
                <h2 className="font-serif text-2xl font-semibold text-primary mb-3">
                  Vivre à {city.name}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {city.livingThere}
                </p>
              </section>
            )}
          </div>
        )}

        <section>
          <h2 className="font-serif text-2xl font-semibold text-primary mb-6">
            Nos biens à {city.name}
          </h2>
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
            <p className="text-muted-foreground">
              Aucun bien disponible actuellement à {city.name}. Contactez-nous pour
              être alerté des nouvelles opportunités.
            </p>
          )}
        </section>

        <LinkGrid heading={`Rechercher par type à ${city.name}`} links={typeLinks} />

        <NearbyCities cities={detail?.nearby ?? []} />

        <FaqSection items={faq} />
      </div>
    </div>
  );
}
