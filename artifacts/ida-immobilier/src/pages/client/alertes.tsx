import { useListSavedSearches, useDeleteSavedSearch, getListSavedSearchesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Alertes() {
  const { data: savedSearches, isLoading } = useListSavedSearches();
  const deleteSearch = useDeleteSavedSearch();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    deleteSearch.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedSearchesQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Mes Alertes</h1>
        <Button className="bg-primary hover:bg-primary/90">Nouvelle alerte</Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : savedSearches && savedSearches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedSearches.map(search => (
            <Card key={search.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-serif text-xl mb-1">{search.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {search.city || "Toutes villes"}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(search.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {search.type && <span className="text-xs bg-muted px-2 py-1 rounded-sm">{search.type}</span>}
                  {search.minPrice || search.maxPrice ? (
                    <span className="text-xs bg-muted px-2 py-1 rounded-sm">
                      {search.minPrice ? `${search.minPrice}€` : "0€"} - {search.maxPrice ? `${search.maxPrice}€` : "Max"}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center text-sm text-primary/80 font-medium">
                  <Bell className="w-4 h-4 mr-2" />
                  Alertes e-mail activées
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border p-12 text-center rounded-xl">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">Aucune alerte configurée</h3>
          <p className="text-muted-foreground mb-4">Créez une alerte pour être notifié des nouveaux biens correspondant à vos critères.</p>
        </div>
      )}
    </div>
  );
}