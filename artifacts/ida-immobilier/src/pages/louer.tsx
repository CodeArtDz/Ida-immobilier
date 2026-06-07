import { useState } from "react";
import { useListProperties } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map } from "lucide-react";

export default function Louer() {
  const [city, setCity] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [type, setType] = useState<string>("all");

  const { data: propertiesResponse, isLoading } = useListProperties({
    status: 'published',
    city: city || undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    type: type !== 'all' ? type as any : undefined,
    limit: 20
  });

  // Filter out sales, only keep properties with rental price
  const properties = propertiesResponse?.data?.filter(p => !!p.rentalPrice) || [];

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-primary mb-8">Louer un bien</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                  <label className="block text-sm font-medium mb-2">Type de bien</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="apartment">Appartement</SelectItem>
                      <SelectItem value="house">Maison</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Loyer Min (€)</label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Loyer Max (€)</label>
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif">
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="text-muted-foreground">
                {isLoading ? "Recherche en cours..." : `${properties.length} biens trouvés`}
              </div>
              <Button variant="outline" className="text-primary border-primary">
                <Map className="w-4 h-4 mr-2" />
                Voir sur la carte
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-xl"></div>
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
                <h3 className="font-serif text-2xl font-semibold mb-2">Aucun bien ne correspond à votre recherche</h3>
                <p className="text-muted-foreground">Modifiez vos critères pour voir plus de résultats.</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}