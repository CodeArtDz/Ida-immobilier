import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetProperty,
  useUpdateProperty,
  getGetPropertyQueryKey,
} from "@workspace/api-client-react";
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
import { ImagePlus } from "lucide-react";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Terrain" },
  { value: "commercial", label: "Local commercial" },
  { value: "building", label: "Immeuble" },
  { value: "programme", label: "Programme neuf" },
  { value: "garage", label: "Garage / Box" },
  { value: "other", label: "Autre" },
];

const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];
const ORIENTATION_OPTIONS = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ouest", "Ouest", "Nord-Ouest"];
const HEATING_OPTIONS = [
  "Individuel gaz", "Collectif gaz", "Électrique", "Pompe à chaleur",
  "Fuel", "Bois / Pellets", "Géothermie", "Solaire",
];

const EQUIPMENT = [
  { key: "hasTerrace", label: "Terrasse" },
  { key: "hasBalcony", label: "Balcon" },
  { key: "hasGarden", label: "Jardin" },
  { key: "hasPool", label: "Piscine" },
  { key: "hasGarage", label: "Garage" },
  { key: "hasParking", label: "Parking" },
  { key: "hasCellar", label: "Cave" },
  { key: "hasElevator", label: "Ascenseur" },
  { key: "hasAirConditioning", label: "Climatisation" },
  { key: "hasFiber", label: "Fibre optique" },
  { key: "hasFireplace", label: "Cheminée" },
] as const;

type EquipmentKey = typeof EQUIPMENT[number]["key"];

const EMPTY_FORM = {
  title: "", type: "apartment", status: "draft",
  address: "", city: "", postalCode: "", department: "", residenceName: "",
  salePrice: "", rentalPrice: "", charges: "", agencyFees: "", taxeFonciere: "",
  livingArea: "", landArea: "", carrezArea: "",
  rooms: "", bedrooms: "", bathrooms: "", toilets: "",
  floor: "", totalFloors: "", yearBuilt: "",
  orientation: "", heating: "",
  dpeRating: "", gesRating: "", annualEnergyCost: "",
  shortDescription: "", fullDescription: "",
  metaTitle: "", metaDescription: "",
};

type FormData = typeof EMPTY_FORM;

export default function EditBien() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: property, isLoading } = useGetProperty(propertyId, {
    query: { enabled: !!propertyId, queryKey: getGetPropertyQueryKey(propertyId) },
  });

  const updateProperty = useUpdateProperty();

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [equipment, setEquipment] = useState<Record<EquipmentKey, boolean>>({
    hasTerrace: false, hasBalcony: false, hasGarden: false, hasPool: false,
    hasGarage: false, hasParking: false, hasCellar: false, hasElevator: false,
    hasAirConditioning: false, hasFiber: false, hasFireplace: false,
  });

  useEffect(() => {
    if (property) {
      const p = property as any;
      setFormData({
        title: p.title || "",
        type: p.type || "apartment",
        status: p.status || "draft",
        address: p.address || "",
        city: p.city || "",
        postalCode: p.postalCode || "",
        department: p.department || "",
        residenceName: p.residenceName || "",
        salePrice: p.salePrice?.toString() || "",
        rentalPrice: p.rentalPrice?.toString() || "",
        charges: p.charges?.toString() || "",
        agencyFees: p.agencyFees?.toString() || "",
        taxeFonciere: p.taxeFonciere?.toString() || "",
        livingArea: p.livingArea?.toString() || "",
        landArea: p.landArea?.toString() || "",
        carrezArea: p.carrezArea?.toString() || "",
        rooms: p.rooms?.toString() || "",
        bedrooms: p.bedrooms?.toString() || "",
        bathrooms: p.bathrooms?.toString() || "",
        toilets: p.toilets?.toString() || "",
        floor: p.floor?.toString() || "",
        totalFloors: p.totalFloors?.toString() || "",
        yearBuilt: p.yearBuilt?.toString() || "",
        orientation: p.orientation || "",
        heating: p.heating || "",
        dpeRating: p.dpeRating || "",
        gesRating: p.gesRating || "",
        annualEnergyCost: p.annualEnergyCost?.toString() || "",
        shortDescription: p.shortDescription || "",
        fullDescription: p.fullDescription || "",
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
      });
      setEquipment({
        hasTerrace: !!p.hasTerrace,
        hasBalcony: !!p.hasBalcony,
        hasGarden: !!p.hasGarden,
        hasPool: !!p.hasPool,
        hasGarage: !!p.hasGarage,
        hasParking: !!p.hasParking,
        hasCellar: !!p.hasCellar,
        hasElevator: !!p.hasElevator,
        hasAirConditioning: !!p.hasAirConditioning,
        hasFiber: !!p.hasFiber,
        hasFireplace: !!(p as any).hasFireplace,
      });
    }
  }, [property]);

  const set = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleEquip = (key: EquipmentKey) =>
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));

  const num = (v: string) => (v ? parseFloat(v) : undefined);
  const int = (v: string) => (v ? parseInt(v) : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProperty.mutate(
      {
        id: propertyId,
        data: {
          title: formData.title,
          type: formData.type as any,
          status: formData.status as any,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          department: formData.department || undefined,
          residenceName: formData.residenceName || undefined,
          salePrice: num(formData.salePrice),
          rentalPrice: num(formData.rentalPrice),
          charges: num(formData.charges),
          agencyFees: num(formData.agencyFees),
          taxeFonciere: num(formData.taxeFonciere),
          livingArea: num(formData.livingArea),
          landArea: num(formData.landArea),
          carrezArea: num(formData.carrezArea),
          rooms: int(formData.rooms),
          bedrooms: int(formData.bedrooms),
          bathrooms: int(formData.bathrooms),
          toilets: int(formData.toilets),
          floor: int(formData.floor),
          totalFloors: int(formData.totalFloors),
          yearBuilt: int(formData.yearBuilt),
          orientation: formData.orientation || undefined,
          heating: formData.heating || undefined,
          dpeRating: formData.dpeRating || undefined,
          gesRating: formData.gesRating || undefined,
          annualEnergyCost: num(formData.annualEnergyCost),
          ...equipment,
          shortDescription: formData.shortDescription || undefined,
          fullDescription: formData.fullDescription || undefined,
          metaTitle: formData.metaTitle || undefined,
          metaDescription: formData.metaDescription || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Bien mis à jour", description: "Les modifications ont été enregistrées." });
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de modifier le bien.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">
          Modifier le bien IDA-{propertyId}
        </h1>
        <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/biens")}>
          Retour à la liste
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Informations principales ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">
            Informations principales
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Titre de l'annonce *</label>
            <Input required value={formData.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Type de bien *</label>
              <Select value={formData.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Statut *</label>
              <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <label className="block text-sm font-medium mb-1.5">Prix de vente (€)</label>
              <Input type="number" value={formData.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Loyer mensuel (€)</label>
              <Input type="number" value={formData.rentalPrice} onChange={(e) => set("rentalPrice", e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Localisation ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Localisation</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Adresse *</label>
            <Input required value={formData.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Code postal *</label>
              <Input required value={formData.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ville *</label>
              <Input required value={formData.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Département</label>
              <Input placeholder="Bouches-du-Rhône" value={formData.department} onChange={(e) => set("department", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Résidence</label>
              <Input placeholder="Les Jardins du Lac" value={formData.residenceName} onChange={(e) => set("residenceName", e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Caractéristiques ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Caractéristiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface habitable (m²)</label>
              <Input type="number" value={formData.livingArea} onChange={(e) => set("livingArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface Carrez (m²)</label>
              <Input type="number" value={formData.carrezArea} onChange={(e) => set("carrezArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface terrain (m²)</label>
              <Input type="number" value={formData.landArea} onChange={(e) => set("landArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Pièces</label>
              <Input type="number" value={formData.rooms} onChange={(e) => set("rooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Chambres</label>
              <Input type="number" value={formData.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Salles de bains</label>
              <Input type="number" value={formData.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sanitaires (WC)</label>
              <Input type="number" value={formData.toilets} onChange={(e) => set("toilets", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Étage</label>
              <Input type="number" value={formData.floor} onChange={(e) => set("floor", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nbre d'étages total</label>
              <Input type="number" value={formData.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Année de construction</label>
              <Input type="number" value={formData.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Orientation</label>
              <Select value={formData.orientation || ""} onValueChange={(v) => set("orientation", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {ORIENTATION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Chauffage</label>
              <Select value={formData.heating || ""} onValueChange={(v) => set("heating", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {HEATING_OPTIONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ── Équipements ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Équipements & prestations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {EQUIPMENT.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleEquip(key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all duration-150 text-left
                  ${equipment[key]
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${equipment[key] ? "bg-primary" : "bg-muted-foreground/30"}`} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── DPE ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">
            Diagnostic de performance énergétique
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Classe DPE</label>
              <Select value={formData.dpeRating || ""} onValueChange={(v) => set("dpeRating", v)}>
                <SelectTrigger><SelectValue placeholder="Non renseigné" /></SelectTrigger>
                <SelectContent>
                  {DPE_OPTIONS.map((d) => <SelectItem key={d} value={d}>Classe {d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Classe GES</label>
              <Select value={formData.gesRating || ""} onValueChange={(v) => set("gesRating", v)}>
                <SelectTrigger><SelectValue placeholder="Non renseigné" /></SelectTrigger>
                <SelectContent>
                  {DPE_OPTIONS.map((d) => <SelectItem key={d} value={d}>Classe {d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Coût annuel énergie (€)</label>
              <Input type="number" value={formData.annualEnergyCost} onChange={(e) => set("annualEnergyCost", e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Tarifs complémentaires ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Tarifs complémentaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Charges mensuelles (€)</label>
              <Input type="number" value={formData.charges} onChange={(e) => set("charges", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Honoraires TTC (€)</label>
              <Input type="number" value={formData.agencyFees} onChange={(e) => set("agencyFees", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Taxe foncière /an (€)</label>
              <Input type="number" value={formData.taxeFonciere} onChange={(e) => set("taxeFonciere", e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Descriptions ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Descriptions</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Accroche</label>
            <Textarea rows={2} value={formData.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description complète</label>
            <Textarea rows={7} value={formData.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} />
          </div>
        </section>

        {/* ── SEO ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Référencement (SEO)</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Titre SEO <span className="text-muted-foreground font-normal">(50-60 caractères recommandés)</span>
            </label>
            <Input
              placeholder="Villa 4 pièces avec piscine à Marignane – I.D.A Immobilier"
              value={formData.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground mt-1">{formData.metaTitle.length}/120 caractères</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Méta-description <span className="text-muted-foreground font-normal">(150-160 caractères recommandés)</span>
            </label>
            <Textarea
              rows={3}
              maxLength={300}
              value={formData.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">{formData.metaDescription.length}/300 caractères</p>
          </div>
        </section>

        {/* ── Médias ── */}
        <section className="bg-card border border-border p-8 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <ImagePlus className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl font-bold">Médias du bien</h2>
          </div>
          <PropertyMediaUploader propertyId={propertyId} />
        </section>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/tableau-de-bord/biens")}
          >
            Retour à la liste
          </Button>
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
