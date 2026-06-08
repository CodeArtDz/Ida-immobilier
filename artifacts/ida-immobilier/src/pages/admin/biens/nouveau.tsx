import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProperty } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PropertyMediaUploader from "@/components/property-media-uploader";
import { CheckCircle2, ImagePlus } from "lucide-react";

export default function NouveauBien() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProperty = useCreateProperty();

  const [step, setStep] = useState<"form" | "media">("form");
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [mediaCount, setMediaCount] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    type: "apartment" as any,
    address: "",
    city: "",
    postalCode: "",
    salePrice: "",
    rentalPrice: "",
    livingArea: "",
    rooms: "",
    bedrooms: "",
    shortDescription: "",
    fullDescription: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProperty.mutate(
      {
        data: {
          ...formData,
          salePrice: formData.salePrice
            ? parseInt(formData.salePrice)
            : undefined,
          rentalPrice: formData.rentalPrice
            ? parseInt(formData.rentalPrice)
            : undefined,
          livingArea: formData.livingArea
            ? parseInt(formData.livingArea)
            : undefined,
          rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
          bedrooms: formData.bedrooms
            ? parseInt(formData.bedrooms)
            : undefined,
        },
      },
      {
        onSuccess: (data) => {
          setPropertyId((data as any).id);
          setStep("media");
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Impossible de créer le bien.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (step === "media" && propertyId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-primary">
                Bien créé avec succès
              </h1>
              <p className="text-sm text-muted-foreground">
                Ajoutez maintenant les photos et vidéos du bien
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/tableau-de-bord/biens")}
            >
              Passer cette étape
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif"
              onClick={() => setLocation("/tableau-de-bord/biens")}
            >
              Terminer
              {mediaCount > 0 && (
                <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {mediaCount} média{mediaCount > 1 ? "s" : ""}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <ImagePlus className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl font-bold">Médias du bien</h2>
          </div>
          <PropertyMediaUploader
            propertyId={propertyId}
            onCountChange={setMediaCount}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">
          Nouveau bien
        </h1>
        <Button
          variant="outline"
          onClick={() => setLocation("/tableau-de-bord/biens")}
        >
          Annuler
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border p-8 rounded-xl space-y-8"
      >
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">
            Informations principales
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Titre de l'annonce *
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <Select
                value={formData.type}
                onValueChange={(val) => handleChange("type", val)}
              >
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
              <label className="block text-sm font-medium mb-2">
                Prix de vente (€)
              </label>
              <Input
                type="number"
                value={formData.salePrice}
                onChange={(e) => handleChange("salePrice", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Loyer mensuel (€)
            </label>
            <Input
              type="number"
              value={formData.rentalPrice}
              onChange={(e) => handleChange("rentalPrice", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">
            Localisation
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">Adresse *</label>
            <Input
              required
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Code postal *
              </label>
              <Input
                required
                value={formData.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ville *</label>
              <Input
                required
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">
            Caractéristiques
          </h2>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Surface (m²)
              </label>
              <Input
                type="number"
                value={formData.livingArea}
                onChange={(e) => handleChange("livingArea", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pièces</label>
              <Input
                type="number"
                value={formData.rooms}
                onChange={(e) => handleChange("rooms", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chambres</label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => handleChange("bedrooms", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">
            Description
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description courte
            </label>
            <Textarea
              value={formData.shortDescription}
              onChange={(e) => handleChange("shortDescription", e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description complète
            </label>
            <Textarea
              value={formData.fullDescription}
              onChange={(e) => handleChange("fullDescription", e.target.value)}
              rows={6}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Étape 1/2 — Les médias seront ajoutés à l'étape suivante
          </p>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif px-8"
            disabled={createProperty.isPending}
          >
            {createProperty.isPending
              ? "Création..."
              : "Continuer → Ajouter des médias"}
          </Button>
        </div>
      </form>
    </div>
  );
}
