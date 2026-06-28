import { Link } from "wouter";
import { ChevronRight, TrendingUp, Home, Tag, Ruler } from "lucide-react";
import type { AreaStats, City } from "@workspace/api-client-react";
import { eur, type FaqEntry } from "@/lib/seo-content";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {it.href ? (
              <Link href={it.href} className="hover:text-primary transition-colors">
                {it.name}
              </Link>
            ) : (
              <span className="text-foreground">{it.name}</span>
            )}
            {i < items.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatsBar({ stats }: { stats: AreaStats }) {
  const cells = [
    { icon: Home, label: "Biens disponibles", value: String(stats.count) },
    { icon: TrendingUp, label: "Prix moyen / m²", value: stats.avgPricePerM2 ? eur(stats.avgPricePerM2) : "—" },
    { icon: Tag, label: "Prix de vente moyen", value: stats.avgSalePrice ? eur(stats.avgSalePrice) : "—" },
    { icon: Ruler, label: "Loyer moyen", value: stats.avgRentalPrice ? `${eur(stats.avgRentalPrice)}/mois` : "—" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cells.map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-5">
          <Icon className="w-5 h-5 text-accent mb-2" />
          <div className="font-serif text-xl font-bold text-primary">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function NearbyCities({ cities, heading }: { cities: City[]; heading?: string }) {
  if (cities.length === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
        {heading ?? "Villes à proximité"}
      </h2>
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <Link
            key={c.slug}
            href={`/immobilier-${c.slug}`}
            className="px-4 py-2 rounded-full border border-border text-sm hover:border-primary hover:text-primary transition-colors"
          >
            Immobilier à {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

// A reusable internal-linking block. Each link is { label, href }.
export function LinkGrid({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  if (links.length === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-primary mb-4">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border text-sm hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-accent shrink-0" />
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FaqSection({ items }: { items: FaqEntry[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-primary mb-4">Questions fréquentes</h2>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-2">{it.question}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{it.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
