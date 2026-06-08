import { useState } from "react";
import { useListProperties } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/property-map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, LayoutGrid } from "lucide-react";

export default function Acheter() {
  const [city, setCity] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [type, setType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { data: propertiesResponse, isLoading } = useListProperties({
    status: "published",
    city: city || undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    type: type !== "all" ? (type as any) : undefined,
    limit: 50,
  });

  // Filter out rentals
  const properties = propertiesResponse?.data?.filter((p) => !p.rentalPrice) || [];

  const applyFilters = () => {
    // filters are reactive; this is just visual feedback
  };

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-primary mb-8">
          Acheter un bien
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar filters */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-6 rounded-xl sticky top-24">
              <h2 className="font-serif text-xl font-semibold mb-6">Filtres</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Ville</label>
                  <Input
                    placeholder="Marseille, Aix-en-Provence..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type de bien
                  </label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="apartment">Appartement</SelectItem>
                      <SelectItem value="house">Maison</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="land">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prix Min (€)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prix Max (€)
                    </label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif"
                  onClick={applyFilters}
                >
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-muted-foreground">
                {isLoading
                  ? "Recherche en cours..."
                  : `${properties.length} bien${properties.length !== 1 ? "s" : ""} trouvé${properties.length !== 1 ? "s" : ""}`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  className={viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-primary border-primary"}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Liste
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  className={viewMode === "map" ? "bg-primary text-primary-foreground" : "text-primary border-primary"}
                  onClick={() => setViewMode("map")}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Carte
                </Button>
              </div>
            </div>

            {/* Map view */}
            {viewMode === "map" && (
              <div className="h-[680px]">
                {isLoading ? (
                  <div className="h-full bg-muted animate-pulse rounded-xl" />
                ) : (
                  <PropertyMap properties={properties} />
                )}
              </div>
            )}

            {/* Grid view */}
            {viewMode === "grid" && (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-96 bg-muted animate-pulse rounded-xl"
                      />
                    ))}
                  </div>
                ) : properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card rounded-xl border border-border">
                    <h3 className="font-serif text-2xl font-semibold mb-2">
                      Aucun bien ne correspond à votre recherche
                    </h3>
                    <p className="text-muted-foreground">
                      Modifiez vos critères pour voir plus de résultats.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6 border-primary text-primary"
                      onClick={() => {
                        setCity("");
                        setMinPrice("");
                        setMaxPrice("");
                        setType("all");
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
