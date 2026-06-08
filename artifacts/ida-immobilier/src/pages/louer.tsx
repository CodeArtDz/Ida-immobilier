import { useState } from "react";
import { useListProperties } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/property-map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, LayoutGrid, RotateCcw } from "lucide-react";

const FEATURES = [
  { key: "hasTerrace", label: "Terrasse" },
  { key: "hasParking", label: "Parking" },
  { key: "hasGarage", label: "Garage" },
  { key: "hasBalcony", label: "Balcon" },
  { key: "hasPool", label: "Piscine" },
  { key: "hasGarden", label: "Jardin" },
] as const;

type FeatureKey = typeof FEATURES[number]["key"];

export default function Louer() {
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("all");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [rooms, setRooms] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [features, setFeatures] = useState<Partial<Record<FeatureKey, boolean>>>({});
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const toggleFeature = (key: FeatureKey) =>
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));

  const { data: propertiesResponse, isLoading } = useListProperties({
    status: "published",
    city: city || undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    type: type !== "all" ? (type as any) : undefined,
    minArea: minArea ? parseFloat(minArea) : undefined,
    maxArea: maxArea ? parseFloat(maxArea) : undefined,
    rooms: rooms !== "all" ? parseInt(rooms) : undefined,
    bedrooms: bedrooms !== "all" ? parseInt(bedrooms) : undefined,
    hasTerrace: features.hasTerrace || undefined,
    hasPool: features.hasPool || undefined,
    hasGarden: features.hasGarden || undefined,
    hasParking: features.hasParking || undefined,
    hasGarage: features.hasGarage || undefined,
    hasBalcony: features.hasBalcony || undefined,
    limit: 50,
  } as any);

  const properties = propertiesResponse?.data?.filter((p) => !!p.rentalPrice) || [];

  const resetFilters = () => {
    setCity(""); setMinPrice(""); setMaxPrice(""); setType("all");
    setMinArea(""); setMaxArea(""); setRooms("all"); setBedrooms("all");
    setFeatures({});
  };

  const hasActiveFilters = city || minPrice || maxPrice || type !== "all" ||
    minArea || maxArea || rooms !== "all" || bedrooms !== "all" ||
    Object.values(features).some(Boolean);

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-primary mb-8">
          Louer un bien
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar filters */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-6 rounded-xl sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">Filtres</h2>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Réinitialiser
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Ville</label>
                <Input
                  placeholder="Marseille, Aix-en-Provence..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Type de bien</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="commercial">Local commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Loyer mensuel (€)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Surface (m²)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
                  <Input type="number" placeholder="Max" value={maxArea} onChange={(e) => setMaxArea(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Pièces min.</label>
                  <Select value={rooms} onValueChange={setRooms}>
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Chambres min.</label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prestations</label>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFeature(key)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all
                        ${features[key]
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="lg:col-span-3">
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
                  <LayoutGrid className="w-4 h-4 mr-2" />Liste
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  className={viewMode === "map" ? "bg-primary text-primary-foreground" : "text-primary border-primary"}
                  onClick={() => setViewMode("map")}
                >
                  <Map className="w-4 h-4 mr-2" />Carte
                </Button>
              </div>
            </div>

            {viewMode === "map" && (
              <div className="h-[680px]">
                {isLoading ? (
                  <div className="h-full bg-muted animate-pulse rounded-xl" />
                ) : (
                  <PropertyMap properties={properties} />
                )}
              </div>
            )}

            {viewMode === "grid" && (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-96 bg-muted animate-pulse rounded-xl" />
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
                      onClick={resetFilters}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
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
