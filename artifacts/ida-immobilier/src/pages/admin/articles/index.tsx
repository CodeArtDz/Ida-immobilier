import {
  useListArticles,
  usePublishArticle,
  useUnpublishArticle,
  useDeleteArticle,
  getListArticlesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Eye, Trash2, Upload, Download } from "lucide-react";
import { Link } from "wouter";

const STATUS_LABEL: Record<string, string> = {
  published: "Publié",
  draft: "Brouillon",
};

export default function ArticlesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useListArticles({ limit: 100 });
  const publishArticle = usePublishArticle();
  const unpublishArticle = useUnpublishArticle();
  const deleteArticle = useDeleteArticle();

  const articles = response?.data ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey({ limit: 100 }) });

  const handlePublish = (id: number, isPublished: boolean) => {
    const mut = isPublished ? unpublishArticle : publishArticle;
    mut.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: isPublished ? "Article dépublié" : "Article publié" });
          invalidate();
        },
        onError: () => toast({ title: "Erreur", description: "Action impossible.", variant: "destructive" }),
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Supprimer cet article ? Cette action est irréversible.")) return;
    deleteArticle.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Article supprimé" });
          invalidate();
        },
        onError: () => toast({ title: "Erreur", description: "Suppression impossible.", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Articles & Guides</h1>
        <Link href="/tableau-de-bord/articles/nouveau">
          <Button className="bg-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel article
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Titre</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell>
              </TableRow>
            ) : articles.length > 0 ? (
              articles.map((article) => {
                const isPublished = article.status === "published";
                return (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium max-w-[320px] truncate">{article.title}</TableCell>
                    <TableCell>{article.cityName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">
                      {article.authorName ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider
                        ${isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABEL[article.status] ?? article.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={isPublished ? "Dépublier" : "Publier"}
                          onClick={() => handlePublish(article.id, isPublished)}
                        >
                          {isPublished ? <Download className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        </Button>
                        {isPublished && (
                          <Button variant="ghost" size="icon" title="Voir" asChild>
                            <Link href={`/blog/${article.slug}`}><Eye className="w-4 h-4" /></Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Modifier" asChild>
                          <Link href={`/tableau-de-bord/articles/${article.id}`}><Edit2 className="w-4 h-4" /></Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(article.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun article</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
