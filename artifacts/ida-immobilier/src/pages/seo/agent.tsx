import { Phone, Mail, Building2, Home } from "lucide-react";
import {
  useGetAgentProfile,
  getGetAgentProfileQueryKey,
  useListProperties,
  getListPropertiesQueryKey,
} from "@workspace/api-client-react";
import { personJsonLd, breadcrumbJsonLd } from "@workspace/seo";
import { PropertyCard } from "@/components/property-card";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import { Breadcrumbs } from "@/components/seo/seo-blocks";
import { SITE_URL } from "@/lib/seo-content";
import NotFound from "@/pages/not-found";

const ROLE_LABEL: Record<string, string> = {
  agent: "Conseiller immobilier",
  agency_manager: "Directeur d'agence",
  admin: "Responsable",
  superadmin: "Direction",
};

export default function Agent({ slug }: { slug: string }) {
  const { data: agent, isLoading } = useGetAgentProfile(slug, {
    query: { enabled: !!slug, queryKey: getGetAgentProfileQueryKey(slug) },
  });

  const propsParams = { status: "published", agentId: agent?.id, limit: 12 } as any;
  const { data: propsResp } = useListProperties(propsParams, {
    query: { enabled: !!agent?.id, queryKey: getListPropertiesQueryKey(propsParams) },
  });
  const properties = propsResp?.data ?? [];

  const fullName = agent ? `${agent.firstName} ${agent.lastName}` : "";
  const jobTitle = agent ? (agent.jobTitle ?? ROLE_LABEL[agent.role] ?? "Conseiller immobilier") : "";
  const url = agent ? `${SITE_URL}/agents/${agent.slug}` : SITE_URL;

  useSeo({
    title: agent ? `${fullName} — ${jobTitle} I.D.A Immobilier` : undefined,
    description: agent
      ? `${fullName}, ${jobTitle.toLowerCase()} chez I.D.A Immobilier. Découvrez ses biens à vendre et à louer et contactez-le pour votre projet immobilier en Provence.`
      : undefined,
    canonical: url,
    ogImage: agent?.avatarUrl ?? undefined,
  });

  useJsonLd(
    agent
      ? [
          personJsonLd({
            name: fullName,
            url,
            jobTitle,
            image: agent.avatarUrl,
            telephone: agent.phone,
            email: agent.email,
            worksFor: agent.agencyName ?? "I.D.A Immobilier",
          }),
          breadcrumbJsonLd([
            { name: "Accueil", url: `${SITE_URL}/` },
            { name: "Nos conseillers", url: `${SITE_URL}/nos-agences` },
            { name: fullName, url },
          ]),
        ]
      : null,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!agent) return <NotFound />;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 space-y-12">
        <Breadcrumbs
          items={[
            { name: "Accueil", href: "/" },
            { name: "Nos agences", href: "/nos-agences" },
            { name: fullName },
          ]}
        />

        <header className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted shrink-0">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif text-4xl text-primary">
                {agent.firstName[0]}
                {agent.lastName[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-4xl font-bold text-primary mb-1">{fullName}</h1>
            <p className="text-accent font-medium mb-4">{jobTitle}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {agent.agencyName && (
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-accent" />
                  {agent.agencyName}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4 text-accent" />
                {agent.propertyCount} bien{agent.propertyCount !== 1 ? "s" : ""} en portefeuille
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="w-4 h-4" />
                  {agent.phone}
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="w-4 h-4" />
                  {agent.email}
                </a>
              )}
            </div>
          </div>
        </header>

        {agent.bio && (
          <section className="max-w-3xl">
            <h2 className="font-serif text-2xl font-semibold text-primary mb-3">À propos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{agent.bio}</p>
          </section>
        )}

        {properties.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-semibold text-primary mb-6">
              Les biens de {agent.firstName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
