import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateArticle } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArticleForm, EMPTY_ARTICLE, type ArticleFormValues } from "./article-form";

function toPayload(values: ArticleFormValues) {
  const tags = values.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title: values.title,
    slug: values.slug || undefined,
    excerpt: values.excerpt || undefined,
    body: values.body || undefined,
    coverImageUrl: values.coverImageUrl || undefined,
    coverImageAlt: values.coverImageAlt || undefined,
    tags,
    cityId: values.cityId ? Number(values.cityId) : null,
    metaTitle: values.metaTitle || undefined,
    metaDescription: values.metaDescription || undefined,
    status: values.status,
  };
}

export default function NouvelArticle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createArticle = useCreateArticle();
  const [values, setValues] = useState<ArticleFormValues>(EMPTY_ARTICLE);

  const handleSubmit = () => {
    createArticle.mutate(
      { data: toPayload(values) },
      {
        onSuccess: () => {
          toast({ title: "Article créé" });
          setLocation("/tableau-de-bord/articles");
        },
        onError: () =>
          toast({ title: "Erreur", description: "Impossible de créer l'article.", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Nouvel article</h1>
        <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/articles")}>
          Annuler
        </Button>
      </div>

      <ArticleForm
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        submitting={createArticle.isPending}
        submitLabel="Créer l'article"
        onCancel={() => setLocation("/tableau-de-bord/articles")}
      />
    </div>
  );
}
