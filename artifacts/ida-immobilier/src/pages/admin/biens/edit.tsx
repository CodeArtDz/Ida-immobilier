import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProperty, useUpdateProperty, getGetPropertyQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function EditBien() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: property, isLoading } = useGetProperty(propertyId, { 
    query: { 
      enabled: !!propertyId,
      queryKey: getGetPropertyQueryKey(propertyId)
    } 
  });

  const updateProperty = useUpdateProperty();

  const [formData, setFormData] = useState({
    title: "",
    type: "apartment" as any,
    address: "",
    city: "",
    postalCode: "",
    salePrice: "",
    livingArea: "",
    rooms: "",
    bedrooms: "",
    shortDescription: "",
    fullDescription: "",
    status: "draft" as any
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        type: property.type || "apartment",
        address: property.address || "",
        city: property.city || "",
        postalCode: property.postalCode || "",
        salePrice: property.salePrice?.toString() || "",
        livingArea: property.livingArea?.toString() || "",
        rooms: property.rooms?.toString() || "",
        bedrooms: property.bedrooms?.toString() || "",
        shortDescription: property.shortDescription || "",
        fullDescription: property.fullDescription || "",
        status: property.status || "draft"
      });
    }
  }, [property]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProperty.mutate({
      id: propertyId,
      data: {
        ...formData,
        salePrice: formData.salePrice ? parseInt(formData.salePrice) : undefined,
        livingArea: formData.livingArea ? parseInt(formData.livingArea) : undefined,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Bien mis à jour", description: "Les modifications ont été enregistrées." });
        setLocation("/tableau-de-bord/biens");
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de modifier le bien.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Modifier le bien IDA-{propertyId}</h1>
        <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/biens")}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-xl space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Informations principales</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Titre de l'annonce *</label>
            <Input required value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="land">Terrain</SelectItem>
                  <SelectItem value="commercial">Local commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut *</label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="reserved">Réservé</SelectItem>
                  <SelectItem value="sold">Vendu</SelectItem>
                  <SelectItem value="rented">Loué</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prix de vente (€)</label>
              <Input type="number" value={formData.salePrice} onChange={(e) => handleChange('salePrice', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Localisation</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Adresse *</label>
            <Input required value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Code postal *</label>
              <Input required value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ville *</label>
              <Input required value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Caractéristiques</h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Surface (m²)</label>
              <Input type="number" value={formData.livingArea} onChange={(e) => handleChange('livingArea', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pièces</label>
              <Input type="number" value={formData.rooms} onChange={(e) => handleChange('rooms', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chambres</label>
              <Input type="number" value={formData.bedrooms} onChange={(e) => handleChange('bedrooms', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Description</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description courte</label>
            <Textarea 
              value={formData.shortDescription} 
              onChange={(e) => handleChange('shortDescription', e.target.value)} 
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description complète</label>
            <Textarea 
              value={formData.fullDescription} 
              onChange={(e) => handleChange('fullDescription', e.target.value)} 
              rows={6}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif px-8"
            disabled={updateProperty.isPending}
          >
            {updateProperty.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}