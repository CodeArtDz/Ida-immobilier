import { Link } from "wouter";
import { useListArticles } from "@workspace/api-client-react";
import { breadcrumbJsonLd, itemListJsonLd } from "@workspace/seo";
import { resolveStorageUrl } from "@/lib/storage-url";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import { Breadcrumbs } from "@/components/seo/seo-blocks";
import { ResponsivePicture } from "@/components/responsive-picture";
import { SITE_URL } from "@/lib/seo-content";
import { Newspaper } from "lucide-react";

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const { data: response, isLoading } = useListArticles({ status: "published", limit: 50 });
  const articles = response?.data ?? [];
  const url = `${SITE_URL}/blog`;

  useSeo({
    title: "Blog & Guides Immobiliers en Provence",
    description:
      "Conseils, guides et actualités immobilières en Provence par I.D.A Immobilier : achat, vente, estimation et vie locale à Marignane et alentours.",
    canonical: url,
  });

  useJsonLd([
    breadcrumbJsonLd([
      { name: "Accueil", url: `${SITE_URL}/` },
      { name: "Blog", url },
    ]),
    itemListJsonLd(
      articles.map((a) => `${SITE_URL}/blog/${a.slug}`),
      "Articles I.D.A Immobilier",
    ),
  ]);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Blog" }]} />

        <header className="max-w-3xl">
          <p className="text-accent text-sm uppercase tracking-widest mb-2">Le Journal I.D.A</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            Blog & Guides Immobiliers
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Conseils d'experts, analyses du marché et guides pratiques pour acheter, vendre et
            vivre en Provence.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const cover = resolveStorageUrl(article.coverImageUrl);
              return (
                <Link key={article.id} href={`/blog/${article.slug}`}>
                  <article className="group bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col cursor-pointer transition-shadow hover:shadow-lg">
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      {cover ? (
                        <ResponsivePicture
                          media={{
                            url: cover,
                            webpUrl: resolveStorageUrl(article.coverImageWebpUrl) || null,
                            avifUrl: resolveStorageUrl(article.coverImageAvifUrl) || null,
                            width: article.coverImageWidth,
                            height: article.coverImageHeight,
                          }}
                          alt={article.coverImageAlt ?? article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Newspaper className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      {article.cityName && (
                        <span className="text-accent text-xs uppercase tracking-widest mb-2">
                          {article.cityName}
                        </span>
                      )}
                      <h2 className="font-serif text-xl font-bold text-primary mb-2 line-clamp-2">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                          {article.excerpt}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground mt-4">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center">
            Aucun article publié pour le moment. Revenez bientôt !
          </p>
        )}
      </div>
    </div>
  );
}
