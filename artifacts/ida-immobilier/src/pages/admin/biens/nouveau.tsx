import { useRef, useState } from "react";
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
import { CheckCircle2, ImagePlus, FileText, Loader2 } from "lucide-react";

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
  "Air / Électrique - individuel", "Fuel", "Bois / Pellets", "Géothermie", "Solaire",
];
const KITCHEN_OPTIONS = [
  "Américaine équipée", "Américaine non équipée", "Séparée équipée",
  "Séparée non équipée", "Coin cuisine", "Cuisine d'été",
];
const WATER_OPTIONS = ["Individuel", "Collectif"];
const SANITATION_OPTIONS = [
  "Tout à l'égout", "Fosse septique", "Assainissement individuel", "Micro-station",
];

const EQUIPMENT = [
  { key: "hasTerrace", label: "Terrasse" },
  { key: "hasBalcony", label: "Balcon" },
  { key: "hasGarden", label: "Jardin privatif" },
  { key: "hasPool", label: "Piscine" },
  { key: "hasGarage", label: "Garage / Box" },
  { key: "hasParking", label: "Parking" },
  { key: "hasCellar", label: "Cave" },
  { key: "hasElevator", label: "Ascenseur" },
  { key: "hasAirConditioning", label: "Climatisation" },
  { key: "hasFiber", label: "Fibre optique" },
  { key: "hasFireplace", label: "Cheminée" },
  { key: "hasDisabledAccess", label: "Accès handicapé" },
] as const;

type EquipmentKey = typeof EQUIPMENT[number]["key"];

const EQUIPMENT_KEYS = new Set<string>(EQUIPMENT.map((e) => e.key));

const EMPTY_FORM = {
  title: "",
  type: "apartment",
  address: "",
  city: "",
  postalCode: "",
  department: "",
  residenceName: "",
  salePrice: "",
  rentalPrice: "",
  charges: "",
  agencyFees: "",
  taxeFonciere: "",
  livingArea: "",
  landArea: "",
  carrezArea: "",
  livingRoomArea: "",
  garageArea: "",
  gardenArea: "",
  terraceArea: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  showerRooms: "",
  toilets: "",
  floor: "",
  totalFloors: "",
  levels: "",
  indoorParking: "",
  outdoorParking: "",
  yearBuilt: "",
  orientation: "",
  heating: "",
  kitchen: "",
  water: "",
  sanitation: "",
  dpeRating: "",
  gesRating: "",
  energyConsumption: "",
  gesEmissions: "",
  annualEnergyCost: "",
  shortDescription: "",
  fullDescription: "",
  metaTitle: "",
  metaDescription: "",
};

type FormData = typeof EMPTY_FORM;

export default function NouveauBien() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProperty = useCreateProperty();

  const [step, setStep] = useState<"form" | "media">("form");
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [equipment, setEquipment] = useState<Record<EquipmentKey, boolean>>({
    hasTerrace: false, hasBalcony: false, hasGarden: false, hasPool: false,
    hasGarage: false, hasParking: false, hasCellar: false, hasElevator: false,
    hasAirConditioning: false, hasFiber: false, hasFireplace: false,
    hasDisabledAccess: false,
  });

  const [importing, setImporting] = useState(false);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const applyFiche = (data: Record<string, string | number | boolean>) => {
    setFormData((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(data)) {
        if (EQUIPMENT_KEYS.has(k)) continue;
        if (k in next) (next as Record<string, string>)[k] = String(v);
      }
      return next;
    });
    setEquipment((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(data)) {
        if (EQUIPMENT_KEYS.has(k) && typeof v === "boolean") {
          next[k as EquipmentKey] = v;
        }
      }
      return next;
    });
  };

  const handlePdfImport = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier PDF.",
        variant: "destructive",
      });
      return;
    }
    setImporting(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/properties/import-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Échec de l'analyse du PDF.");
      }
      applyFiche(json.data ?? {});
      toast({
        title: "Fiche analysée",
        description: `${json.fieldsFound ?? 0} champ(s) pré-rempli(s). Vérifiez les informations avant d'enregistrer.`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'analyser le PDF.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const toggleEquip = (key: EquipmentKey) =>
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));

  const num = (v: string) => (v ? parseFloat(v) : undefined);
  const int = (v: string) => (v ? parseInt(v) : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProperty.mutate(
      {
        data: {
          title: formData.title,
          type: formData.type as any,
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
          livingRoomArea: num(formData.livingRoomArea),
          garageArea: num(formData.garageArea),
          gardenArea: num(formData.gardenArea),
          terraceArea: num(formData.terraceArea),
          rooms: int(formData.rooms),
          bedrooms: int(formData.bedrooms),
          bathrooms: int(formData.bathrooms),
          showerRooms: int(formData.showerRooms),
          toilets: int(formData.toilets),
          floor: int(formData.floor),
          totalFloors: int(formData.totalFloors),
          levels: int(formData.levels),
          indoorParking: int(formData.indoorParking),
          outdoorParking: int(formData.outdoorParking),
          yearBuilt: int(formData.yearBuilt),
          orientation: formData.orientation || undefined,
          heating: formData.heating || undefined,
          kitchen: formData.kitchen || undefined,
          water: formData.water || undefined,
          sanitation: formData.sanitation || undefined,
          dpeRating: formData.dpeRating || undefined,
          gesRating: formData.gesRating || undefined,
          energyConsumption: num(formData.energyConsumption),
          gesEmissions: num(formData.gesEmissions),
          annualEnergyCost: num(formData.annualEnergyCost),
          ...equipment,
          shortDescription: formData.shortDescription || undefined,
          fullDescription: formData.fullDescription || undefined,
          metaTitle: formData.metaTitle || undefined,
          metaDescription: formData.metaDescription || undefined,
        } as any,
      },
      {
        onSuccess: (data) => {
          setPropertyId((data as any).id);
          setStep("media");
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de créer le bien.", variant: "destructive" });
        },
      }
    );
  };

  if (step === "media" && propertyId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-primary">Bien créé avec succès</h1>
              <p className="text-sm text-muted-foreground">Ajoutez maintenant les photos et vidéos du bien</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/biens")}>
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
          <PropertyMediaUploader propertyId={propertyId} onCountChange={setMediaCount} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Nouveau bien</h1>
        <Button variant="outline" onClick={() => setLocation("/tableau-de-bord/biens")}>
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Import fiche PDF ── */}
        <section
          className={`p-6 rounded-xl border border-dashed transition-colors ${
            pdfDragOver ? "border-primary bg-primary/10" : "border-primary/30 bg-primary/5"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setPdfDragOver(true);
          }}
          onDragLeave={() => setPdfDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setPdfDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handlePdfImport(file);
          }}
        >
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfImport(file);
            }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto sm:mx-0">
              {importing ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-serif text-lg font-bold text-primary">
                Importer une fiche privée (PDF)
              </h2>
              <p className="text-sm text-muted-foreground">
                Glissez un PDF ici ou parcourez pour pré-remplir automatiquement le
                formulaire. Les informations extraites restent modifiables avant
                l'enregistrement.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => pdfInputRef.current?.click()}
              className="border-primary/40 text-primary hover:bg-primary/10 shrink-0"
            >
              {importing ? "Analyse en cours..." : "Choisir un PDF"}
            </Button>
          </div>
        </section>

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
              <label className="block text-sm font-medium mb-1.5">Prix de vente (€)</label>
              <Input type="number" placeholder="350000" value={formData.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Loyer mensuel (€)</label>
              <Input type="number" placeholder="1200" value={formData.rentalPrice} onChange={(e) => set("rentalPrice", e.target.value)} />
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
              <label className="block text-sm font-medium mb-1.5">Résidence / Copropriété</label>
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
              <Input type="number" placeholder="75" value={formData.livingArea} onChange={(e) => set("livingArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface Carrez (m²)</label>
              <Input type="number" placeholder="72" value={formData.carrezArea} onChange={(e) => set("carrezArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface terrain (m²)</label>
              <Input type="number" placeholder="500" value={formData.landArea} onChange={(e) => set("landArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface séjour (m²)</label>
              <Input type="number" placeholder="35" value={formData.livingRoomArea} onChange={(e) => set("livingRoomArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface garage (m²)</label>
              <Input type="number" placeholder="20" value={formData.garageArea} onChange={(e) => set("garageArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface jardin (m²)</label>
              <Input type="number" placeholder="600" value={formData.gardenArea} onChange={(e) => set("gardenArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Surface terrasse (m²)</label>
              <Input type="number" placeholder="20" value={formData.terraceArea} onChange={(e) => set("terraceArea", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Pièces</label>
              <Input type="number" placeholder="4" value={formData.rooms} onChange={(e) => set("rooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Chambres</label>
              <Input type="number" placeholder="3" value={formData.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Salles de bain</label>
              <Input type="number" placeholder="1" value={formData.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Salles d'eau</label>
              <Input type="number" placeholder="1" value={formData.showerRooms} onChange={(e) => set("showerRooms", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">WC</label>
              <Input type="number" placeholder="2" value={formData.toilets} onChange={(e) => set("toilets", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Étage</label>
              <Input type="number" placeholder="3" value={formData.floor} onChange={(e) => set("floor", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nbre d'étages total</label>
              <Input type="number" placeholder="5" value={formData.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre de niveaux</label>
              <Input type="number" placeholder="2" value={formData.levels} onChange={(e) => set("levels", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Parkings intérieur</label>
              <Input type="number" placeholder="0" value={formData.indoorParking} onChange={(e) => set("indoorParking", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Parkings extérieur</label>
              <Input type="number" placeholder="2" value={formData.outdoorParking} onChange={(e) => set("outdoorParking", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Année de construction</label>
              <Input type="number" placeholder="1995" value={formData.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Exposition</label>
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
            <div>
              <label className="block text-sm font-medium mb-1.5">Cuisine</label>
              <Select value={formData.kitchen || ""} onValueChange={(v) => set("kitchen", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {KITCHEN_OPTIONS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Eau</label>
              <Select value={formData.water || ""} onValueChange={(v) => set("water", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {WATER_OPTIONS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Assainissement</label>
              <Select value={formData.sanitation || ""} onValueChange={(v) => set("sanitation", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {SANITATION_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <label className="block text-sm font-medium mb-1.5">Consommation énergétique (kWh/m²/an)</label>
              <Input type="number" placeholder="71" value={formData.energyConsumption} onChange={(e) => set("energyConsumption", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Émissions GES (kg eqCO₂/m²/an)</label>
              <Input type="number" placeholder="2" value={formData.gesEmissions} onChange={(e) => set("gesEmissions", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Coût annuel énergie (€)</label>
              <Input type="number" placeholder="1200" value={formData.annualEnergyCost} onChange={(e) => set("annualEnergyCost", e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Tarifs annexes ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Tarifs complémentaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Charges mensuelles (€)</label>
              <Input type="number" placeholder="150" value={formData.charges} onChange={(e) => set("charges", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Honoraires TTC (€)</label>
              <Input type="number" placeholder="12000" value={formData.agencyFees} onChange={(e) => set("agencyFees", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Taxe foncière /an (€)</label>
              <Input type="number" placeholder="800" value={formData.taxeFonciere} onChange={(e) => set("taxeFonciere", e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Descriptions ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Descriptions</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Accroche (courte description)</label>
            <Textarea
              placeholder="Magnifique villa avec vue mer..."
              value={formData.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description complète</label>
            <Textarea
              placeholder="Description détaillée du bien, de son environnement, de ses atouts..."
              value={formData.fullDescription}
              onChange={(e) => set("fullDescription", e.target.value)}
              rows={7}
            />
          </div>
        </section>

        {/* ── SEO ── */}
        <section className="bg-card border border-border p-8 rounded-xl space-y-4">
          <h2 className="font-serif text-xl font-bold border-b border-border pb-2">Référencement (SEO)</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Titre SEO <span className="text-muted-foreground font-normal">(recommandé : 50-60 caractères)</span>
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
              Méta-description <span className="text-muted-foreground font-normal">(recommandé : 150-160 caractères)</span>
            </label>
            <Textarea
              placeholder="Découvrez cette villa d'exception de 180 m² avec piscine, jardin et 4 chambres, idéalement située à Marignane."
              value={formData.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1">{formData.metaDescription.length}/300 caractères</p>
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Étape 1/2 — Les médias seront ajoutés à l'étape suivante
          </p>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif px-8"
            disabled={createProperty.isPending}
          >
            {createProperty.isPending ? "Création..." : "Continuer → Ajouter des médias"}
          </Button>
        </div>
      </form>
    </div>
  );
}
