import { useListFavorites } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";

export default function Favoris() {
  const { data: favorites, isLoading } = useListFavorites();

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-primary mb-8">Mes Favoris</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(fav =>
            fav.property ? <PropertyCard key={fav.id} property={fav.property as any} /> : null
          )}
        </div>
      ) : (
        <div className="bg-card border border-border p-12 text-center rounded-xl">
          <p className="text-muted-foreground mb-4">Vous n'avez pas encore de favoris.</p>
        </div>
      )}
    </div>
  );
}