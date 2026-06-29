import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetArticle, useUpdateArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArticleForm, EMPTY_ARTICLE, type ArticleFormValues } from "./article-form";

function toUpdatePayload(values: ArticleFormValues) {
  const tags = values.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title: values.title,
    slug: values.slug || undefined,
    excerpt: values.excerpt,
    body: values.body,
    coverImageUrl: values.coverImageUrl || null,
    coverImageWebpUrl: values.coverImageWebpUrl || null,
    coverImageAvifUrl: values.coverImageAvifUrl || null,
    coverImageWidth: values.coverImageWidth ?? null,
    coverImageHeight: values.coverImageHeight ?? null,
    coverImageAlt: values.coverImageAlt || null,
    tags,
    cityId: values.cityId ? Number(values.cityId) : null,
    metaTitle: values.metaTitle,
    metaDescription: values.metaDescription,
    status: values.status,
    publishedAt: values.publishedAt
      ? new Date(values.publishedAt).toISOString()
      : null,
  };
}

// Convert an ISO date-time to the `datetime-local` input format (local time,
// no seconds/zone): YYYY-MM-DDTHH:mm.
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditArticle() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: article, isLoading } = useGetArticle(id, {
    query: { enabled: !Number.isNaN(id), queryKey: getGetArticleQueryKey(id) },
  });
  const updateArticle = useUpdateArticle();
  const [values, setValues] = useState<ArticleFormValues>(EMPTY_ARTICLE);

  useEffect(() => {
    if (article) {
      setValues({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? "",
        body: article.body,
        coverImageUrl: article.coverImageUrl ?? "",
        coverImageWebpUrl: article.coverImageWebpUrl ?? "",
        coverImageAvifUrl: article.coverImageAvifUrl ?? "",
        coverImageWidth: article.coverImageWidth ?? null,
        coverImageHeight: article.coverImageHeight ?? null,
        coverImageAlt: article.coverImageAlt ?? "",
        tags: (article.tags ?? []).join(", "),
        cityId: article.cityId != null ? String(article.cityId) : "",
        metaTitle: article.metaTitle ?? "",
        metaDescription: article.metaDescription ?? "",
        status: article.status === "published" ? "published" : "draft",
        publishedAt: toLocalInput(article.publishedAt),
      });
    }
  }, [article]);

  const handleSubmit = () => {
    updateArticle.mutate(
      { id, data: toUpdatePayload(values) },
      {
        onSuccess: () => {
          toast({ title: "Article mis à jour" });
          setLocation("/tableau-de-bord/articles");
        },
        onError: () =>
          toast({ title: "Erreur", description: "Impossible de mettre à jour l'article.", variant: "destructive" }),
      },
    );
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/articles")}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Modifier l'article</h1>
        <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/articles")}>
          Annuler
        </Button>
      </div>

      <ArticleForm
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        submitting={updateArticle.isPending}
        submitLabel="Enregistrer les modifications"
        onCancel={() => setLocation("/tableau-de-bord/articles")}
      />
    </div>
  );
}
