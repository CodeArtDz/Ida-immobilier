import { useMemo } from "react";
import { Link } from "wouter";
import DOMPurify from "dompurify";
import { useGetArticleBySlug, getGetArticleBySlugQueryKey } from "@workspace/api-client-react";
import { breadcrumbJsonLd } from "@workspace/seo";
import { resolveStorageUrl } from "@/lib/storage-url";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import { Breadcrumbs } from "@/components/seo/seo-blocks";
import { ResponsivePicture } from "@/components/responsive-picture";
import { ORG, SITE_URL } from "@/lib/seo-content";
import NotFound from "@/pages/not-found";

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogArticle({ slug }: { slug: string }) {
  const { data: article, isLoading } = useGetArticleBySlug(slug, {
    query: { enabled: !!slug, queryKey: getGetArticleBySlugQueryKey(slug) },
  });

  const url = `${SITE_URL}/blog/${slug}`;
  const cover = resolveStorageUrl(article?.coverImageUrl);

  const sanitizedBody = useMemo(
    () => (article?.body ? DOMPurify.sanitize(article.body) : ""),
    [article?.body],
  );

  useSeo({
    title: article?.metaTitle ?? article?.title,
    description: article?.metaDescription ?? article?.excerpt ?? undefined,
    canonical: url,
    ogType: "article",
    ogImage: cover ?? undefined,
  });

  useJsonLd(
    article
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.metaDescription ?? article.excerpt ?? undefined,
            image: cover ? [cover] : undefined,
            datePublished: article.publishedAt ?? article.createdAt,
            dateModified: article.updatedAt ?? article.publishedAt ?? article.createdAt,
            author: {
              "@type": article.authorName ? "Person" : "Organization",
              name: article.authorName ?? ORG.name,
            },
            publisher: {
              "@type": "Organization",
              name: ORG.name,
              logo: { "@type": "ImageObject", url: ORG.logoUrl },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          },
          breadcrumbJsonLd([
            { name: "Accueil", url: `${SITE_URL}/` },
            { name: "Blog", url: `${SITE_URL}/blog` },
            { name: article.title, url },
          ]),
        ]
      : null,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="h-10 w-3/4 bg-muted animate-pulse rounded mb-6" />
        <div className="h-64 bg-muted animate-pulse rounded-xl mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) return <NotFound />;

  return (
    <div className="bg-background min-h-screen">
      <article className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { name: "Accueil", href: "/" },
            { name: "Blog", href: "/blog" },
            { name: article.title },
          ]}
        />

        <header className="space-y-4">
          {article.cityName && (
            <Link href={`/immobilier-${article.citySlug}`}>
              <span className="text-accent text-sm uppercase tracking-widest cursor-pointer hover:underline">
                {article.cityName}
              </span>
            </Link>
          )}
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {article.authorName && <span>Par {article.authorName}</span>}
            {article.authorName && article.publishedAt && <span>•</span>}
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          </div>
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
          )}
        </header>

        {cover && (
          <ResponsivePicture
            media={{
              url: cover,
              webpUrl: resolveStorageUrl(article.coverImageWebpUrl) || null,
              avifUrl: resolveStorageUrl(article.coverImageAvifUrl) || null,
              width: article.coverImageWidth,
              height: article.coverImageHeight,
            }}
            alt={article.coverImageAlt ?? article.title}
            className="w-full rounded-xl border border-border"
            loading="eager"
          />
        )}

        <div
          className="prose prose-neutral max-w-none prose-headings:font-serif prose-headings:text-primary prose-a:text-accent"
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        />

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-6">
          <Link href="/blog">
            <span className="text-accent hover:underline cursor-pointer">← Retour au blog</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
