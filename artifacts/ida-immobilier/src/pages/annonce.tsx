import { useParams } from "wouter";
import { useGetProperty, useGetSimilarProperties, getGetPropertyQueryKey } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize, Bed, Bath, Mail, Phone, Calendar, Heart } from "lucide-react";
import property1 from "@/assets/images/property-1.png";

export default function Annonce() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0");
  
  const { data: property, isLoading } = useGetProperty(propertyId, { 
    query: { 
      enabled: !!propertyId,
      queryKey: getGetPropertyQueryKey(propertyId)
    } 
  });
  
  const { data: similarProperties } = useGetSimilarProperties(propertyId, {
    query: {
      enabled: !!propertyId && !!property
    }
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!property) {
    return <div className="min-h-screen flex items-center justify-center">Bien introuvable.</div>;
  }

  const price = property.salePrice || property.rentalPrice;
  const formattedPrice = price ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price) : 'Prix sur demande';
  const isRental = !!property.rentalPrice;

  return (
    <div className="bg-background min-h-screen">
      {/* Gallery Header */}
      <div className="w-full h-[60vh] bg-muted relative">
        <img 
          src={property.mainImageUrl || property1} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full">
          <div className="container mx-auto px-4 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-foreground">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold uppercase tracking-wider rounded-sm">
                  {isRental ? 'À Louer' : 'À Vendre'}
                </span>
                <span className="bg-accent text-accent-foreground px-3 py-1 text-sm font-semibold capitalize rounded-sm">
                  {property.type}
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{property.title}</h1>
              <p className="flex items-center text-lg text-foreground/80">
                <MapPin className="w-5 h-5 mr-2" />
                {property.city}, {property.postalCode}
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="font-serif text-4xl md:text-5xl font-bold text-primary">
                {formattedPrice}
                {isRental && <span className="text-xl font-normal text-foreground/60"> /mois</span>}
              </div>
              <Button variant="outline" className="bg-background/50 backdrop-blur-md border-border hover:bg-background">
                <Heart className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Key Features */}
            <div className="flex flex-wrap gap-8 py-6 border-y border-border">
              {property.livingArea && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Maximize className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surface habitable</p>
                    <p className="font-semibold text-lg">{property.livingArea} m²</p>
                  </div>
                </div>
              )}
              {property.bedrooms !== null && property.bedrooms !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Bed className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chambres</p>
                    <p className="font-semibold text-lg">{property.bedrooms}</p>
                  </div>
                </div>
              )}
              {property.rooms !== null && property.rooms !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Bath className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pièces</p>
                    <p className="font-semibold text-lg">{property.rooms}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Description</h2>
              <div className="prose prose-lg text-foreground/80 max-w-none">
                <p className="whitespace-pre-line">{property.fullDescription || property.shortDescription || "Aucune description disponible."}</p>
              </div>
            </div>

            {/* Features & Amenities */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Prestations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.hasTerrace && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Terrasse</div>}
                {property.hasBalcony && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Balcon</div>}
                {property.hasGarden && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Jardin</div>}
                {property.hasPool && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Piscine</div>}
                {property.hasGarage && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Garage</div>}
                {property.hasParking && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Parking</div>}
                {property.hasCellar && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Cave</div>}
                {property.hasElevator && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Ascenseur</div>}
                {property.hasAirConditioning && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Climatisation</div>}
                {property.hasFiber && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Fibre optique</div>}
              </div>
            </div>

            {/* Energy */}
            {(property.dpeRating || property.gesRating) && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-primary mb-6">Diagnostic de Performance Énergétique</h2>
                <div className="flex gap-8">
                  {property.dpeRating && (
                    <div className="flex-1 max-w-[200px]">
                      <div className="text-sm font-semibold mb-2">DPE</div>
                      <div className={`w-16 h-16 rounded-md flex items-center justify-center text-white font-bold text-2xl
                        ${property.dpeRating === 'A' ? 'bg-green-600' : 
                          property.dpeRating === 'B' ? 'bg-green-500' : 
                          property.dpeRating === 'C' ? 'bg-green-400' : 
                          property.dpeRating === 'D' ? 'bg-yellow-500' : 
                          property.dpeRating === 'E' ? 'bg-orange-500' : 
                          property.dpeRating === 'F' ? 'bg-orange-600' : 'bg-red-600'}`}
                      >
                        {property.dpeRating}
                      </div>
                    </div>
                  )}
                  {property.gesRating && (
                    <div className="flex-1 max-w-[200px]">
                      <div className="text-sm font-semibold mb-2">GES</div>
                      <div className={`w-16 h-16 rounded-md flex items-center justify-center text-white font-bold text-2xl
                        ${property.gesRating === 'A' ? 'bg-blue-300' : 
                          property.gesRating === 'B' ? 'bg-blue-400' : 
                          property.gesRating === 'C' ? 'bg-blue-500' : 
                          property.gesRating === 'D' ? 'bg-purple-500' : 
                          property.gesRating === 'E' ? 'bg-purple-600' : 
                          property.gesRating === 'F' ? 'bg-purple-700' : 'bg-purple-800'}`}
                      >
                        {property.gesRating}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-6 rounded-xl sticky top-24">
              <h3 className="font-serif text-xl font-bold text-primary mb-6">Contactez l'agence</h3>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden">
                  {property.agentAvatarUrl ? (
                    <img src={property.agentAvatarUrl} alt={property.agentName || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {property.agentName?.charAt(0) || "A"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-lg">{property.agentName || "Agent I.D.A"}</div>
                  <div className="text-sm text-muted-foreground">{property.agencyName || "I.D.A Immobilier"}</div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <Button className="w-full justify-start text-left font-normal bg-primary hover:bg-primary/90 text-primary-foreground h-12">
                  <Mail className="w-5 h-5 mr-3" />
                  Envoyer un message
                </Button>
                <Button variant="outline" className="w-full justify-start text-left font-normal border-primary text-primary h-12">
                  <Phone className="w-5 h-5 mr-3" />
                  {property.agentPhone || "Voir le numéro"}
                </Button>
                <Button variant="outline" className="w-full justify-start text-left font-normal border-primary text-primary h-12">
                  <Calendar className="w-5 h-5 mr-3" />
                  Planifier une visite
                </Button>
              </div>

              <div className="text-sm text-muted-foreground pt-6 border-t border-border">
                <div className="flex justify-between mb-2">
                  <span>Référence</span>
                  <span className="font-mono text-foreground">IDA-{property.id}</span>
                </div>
                {property.agencyFees && (
                  <div className="flex justify-between mb-2">
                    <span>Honoraires TTC</span>
                    <span className="text-foreground">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.agencyFees)}</span>
                  </div>
                )}
                {property.charges && (
                  <div className="flex justify-between mb-2">
                    <span>Charges mensuelles</span>
                    <span className="text-foreground">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.charges)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {similarProperties && similarProperties.length > 0 && (
          <div className="mt-24">
            <h2 className="font-serif text-3xl font-bold text-primary mb-8">Biens similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {similarProperties.slice(0, 3).map((simProp) => (
                <PropertyCard key={simProp.id} property={simProp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}