import { Link } from "wouter";
import { CheckCircle2, TrendingUp, ShieldCheck, Clock } from "lucide-react";
import { useGetCityDetail, getGetCityDetailQueryKey } from "@workspace/api-client-react";
import {
  breadcrumbJsonLd,
  realEstateAgentJsonLd,
  faqJsonLd,
} from "@workspace/seo";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import { Breadcrumbs, StatsBar, FaqSection, NearbyCities } from "@/components/seo/seo-blocks";
import { ORG, SITE_URL, eur } from "@/lib/seo-content";
import NotFound from "@/pages/not-found";

const STEPS = [
  { icon: Clock, title: "Demande en 2 minutes", text: "Renseignez les caractéristiques de votre bien en quelques clics." },
  { icon: TrendingUp, title: "Analyse du marché local", text: "Nos experts croisent votre bien avec les transactions récentes." },
  { icon: ShieldCheck, title: "Estimation gratuite et fiable", text: "Vous recevez une fourchette de prix réaliste et argumentée." },
];

export default function EstimationVille({ slug }: { slug: string }) {
  const { data: detail, isLoading } = useGetCityDetail(slug, {
    query: { enabled: !!slug, queryKey: getGetCityDetailQueryKey(slug) },
  });
  const city = detail?.city;
  const url = city ? `${SITE_URL}/estimation-immobiliere-${city.slug}` : SITE_URL;

  const faq = city && detail
    ? [
        {
          question: `L'estimation d'un bien à ${city.name} est-elle gratuite ?`,
          answer: `Oui, l'estimation de votre bien à ${city.name} par I.D.A Immobilier est entièrement gratuite et sans engagement.`,
        },
        ...(detail.stats.avgPricePerM2
          ? [{
              question: `Quel est le prix moyen au m² à ${city.name} ?`,
              answer: `Le prix moyen constaté sur nos biens à ${city.name} est d'environ ${eur(detail.stats.avgPricePerM2)} le m². Une estimation personnalisée reste indispensable pour tenir compte des spécificités de votre bien.`,
            }]
          : []),
        {
          question: `Combien de temps prend une estimation ?`,
          answer: `La demande en ligne prend deux minutes. Nos conseillers reviennent vers vous rapidement avec une évaluation détaillée, suivie si vous le souhaitez d'une visite sur place.`,
        },
      ]
    : [];

  useSeo({
    title: city ? `Estimation immobilière gratuite à ${city.name}` : undefined,
    description: city
      ? `Estimez gratuitement votre bien immobilier à ${city.name} avec I.D.A Immobilier. Évaluation fiable basée sur le marché local, sans engagement. Vendez au meilleur prix.`
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
            { name: `Estimation à ${city.name}`, url },
          ]),
          faqJsonLd(faq),
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
            { name: `Estimation à ${city.name}` },
          ]}
        />

        <header className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            Estimation immobilière gratuite à {city.name}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Vous envisagez de vendre à {city.name} ? Obtenez une estimation
            précise et gratuite de votre bien, réalisée par des experts qui
            connaissent parfaitement le marché local.
          </p>
          <Link href={`/estimation?city=${encodeURIComponent(city.name)}`}>
            <Button className="bg-primary text-primary-foreground mt-6">
              Estimer mon bien gratuitement
            </Button>
          </Link>
        </header>

        {detail && <StatsBar stats={detail.stats} />}

        <section className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6">
              <Icon className="w-7 h-7 text-accent mb-3" />
              <h2 className="font-serif text-lg font-semibold text-primary mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </section>

        <section className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Pourquoi estimer avec I.D.A Immobilier ?
          </h2>
          <ul className="grid md:grid-cols-2 gap-3 text-sm">
            {[
              "Connaissance fine du marché de " + city.name,
              "Estimation gratuite et sans engagement",
              "Conseils personnalisés pour vendre au meilleur prix",
              "Accompagnement de l'estimation à la signature",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <FaqSection items={faq} />

        <NearbyCities cities={detail?.nearby ?? []} heading="Estimation dans les villes voisines" />
      </div>
    </div>
  );
}
