import { useRef, useState } from "react";
import { useListCities } from "@workspace/api-client-react";
import { resolveStorageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, X } from "lucide-react";

export interface ArticleFormValues {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  coverImageWebpUrl: string;
  coverImageAvifUrl: string;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  coverImageAlt: string;
  tags: string;
  cityId: string;
  metaTitle: string;
  metaDescription: string;
  status: "draft" | "published";
  publishedAt: string;
}

export const EMPTY_ARTICLE: ArticleFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  coverImageWebpUrl: "",
  coverImageAvifUrl: "",
  coverImageWidth: null,
  coverImageHeight: null,
  coverImageAlt: "",
  tags: "",
  cityId: "",
  metaTitle: "",
  metaDescription: "",
  status: "draft",
  publishedAt: "",
};

const NO_CITY = "__none__";

interface ArticleFormProps {
  values: ArticleFormValues;
  onChange: (values: ArticleFormValues) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function ArticleForm({
  values,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
}: ArticleFormProps) {
  const { toast } = useToast();
  const { data: cities = [] } = useListCities();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof ArticleFormValues, value: string) =>
    onChange({ ...values, [field]: value });

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Format non supporté", description: "Veuillez choisir une image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/articles/cover-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Échec du téléversement.");
      const url = json.coverImageUrl;
      if (!url) throw new Error("Réponse du serveur invalide.");
      onChange({
        ...values,
        coverImageUrl: url,
        coverImageWebpUrl: json.coverImageWebpUrl ?? "",
        coverImageAvifUrl: json.coverImageAvifUrl ?? "",
        coverImageWidth: json.coverImageWidth ?? null,
        coverImageHeight: json.coverImageHeight ?? null,
      });
      toast({ title: "Image téléversée" });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Téléversement impossible.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const coverPreview = resolveStorageUrl(values.coverImageUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contenu principal */}
      <section className="bg-card border border-border p-8 rounded-xl space-y-4">
        <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Contenu</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Titre *</label>
          <Input required value={values.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Slug (URL)</label>
          <Input
            placeholder="laissez vide pour générer automatiquement"
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            L'article sera accessible sur /blog/{values.slug || "votre-slug"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Extrait</label>
          <Textarea
            rows={2}
            placeholder="Court résumé affiché dans la liste des articles"
            value={values.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Corps de l'article *</label>
          <Textarea
            rows={16}
            required
            placeholder="Contenu de l'article (HTML autorisé)"
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      </section>

      {/* Image de couverture */}
      <section className="bg-card border border-border p-8 rounded-xl space-y-4">
        <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Image de couverture</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

        {coverPreview ? (
          <div className="relative w-full max-w-md">
            <img src={coverPreview} alt={values.coverImageAlt} className="w-full rounded-lg border border-border" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() =>
                onChange({
                  ...values,
                  coverImageUrl: "",
                  coverImageWebpUrl: "",
                  coverImageAvifUrl: "",
                  coverImageWidth: null,
                  coverImageHeight: null,
                })
              }
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Téléversement..." : "Téléverser une image"}
          </Button>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Texte alternatif (alt)</label>
          <Input
            placeholder="Description de l'image pour le référencement"
            value={values.coverImageAlt}
            onChange={(e) => set("coverImageAlt", e.target.value)}
          />
        </div>
      </section>

      {/* Classement */}
      <section className="bg-card border border-border p-8 rounded-xl space-y-4">
        <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Classement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Ville associée</label>
            <Select
              value={values.cityId || NO_CITY}
              onValueChange={(v) => set("cityId", v === NO_CITY ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CITY}>Aucune</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (séparés par des virgules)</label>
            <Input
              placeholder="guide, achat, marignane"
              value={values.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="bg-card border border-border p-8 rounded-xl space-y-4">
        <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Référencement (SEO)</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Meta title</label>
          <Input value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Meta description</label>
          <Textarea rows={2} value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
        </div>
      </section>

      {/* Statut + actions */}
      <section className="bg-card border border-border p-8 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1.5">Statut</label>
            <Select value={values.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Date de publication</label>
            <Input
              type="datetime-local"
              value={values.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Laissez vide pour utiliser la date de publication automatique.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif"
        >
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
