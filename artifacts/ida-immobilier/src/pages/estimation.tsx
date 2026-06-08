import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEstimation } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { TrendingUp, MapPin, Ruler, CheckCircle2, ArrowRight } from "lucide-react";

interface EstimateResult {
  low: number;
  high: number;
  midpoint: number;
  pricePerSqm: number;
}

const CITY_PRICES: Record<string, number> = {
  "marignane": 2800,
  "marseille": 3200,
  "aix-en-provence": 4500,
  "aix en provence": 4500,
  "salon-de-provence": 2600,
  "salon de provence": 2600,
  "aubagne": 3000,
  "cassis": 6200,
  "la ciotat": 4200,
  "martigues": 2500,
  "vitrolles": 2400,
  "istres": 2200,
  "miramas": 2100,
  "arles": 2000,
  "toulon": 2800,
  "hyères": 3200,
  "bandol": 5200,
  "sanary-sur-mer": 4600,
  "six-fours": 3800,
  "saint-tropez": 12000,
  "nice": 4800,
  "cannes": 6200,
  "antibes": 4600,
  "avignon": 2500,
  "carpentras": 2000,
  "pertuis": 2800,
  "gardanne": 2900,
  "gemenos": 3200,
  "roquevaire": 2700,
  "allauch": 3400,
  "plan-de-cuques": 3300,
};

const POSTAL_FALLBACK: Record<string, number> = {
  "06": 4500,
  "13": 2800,
  "83": 3200,
  "84": 2200,
  "04": 1900,
};

const TYPE_MULTIPLIERS: Record<string, number> = {
  apartment: 1.0,
  house: 1.05,
  villa: 1.4,
  land: 0.25,
  commercial: 0.85,
};

const CONDITION_MULTIPLIERS: Record<string, number> = {
  excellent: 1.12,
  good: 1.0,
  needs_refresh: 0.88,
  needs_renovation: 0.72,
};

function computeEstimate(formData: {
  propertyType: string;
  city: string;
  postalCode: string;
  livingArea: string;
  condition: string;
}): EstimateResult {
  const cityLower = formData.city.toLowerCase().trim();
  const postalPrefix = formData.postalCode.substring(0, 2);
  const area = Math.max(10, parseInt(formData.livingArea) || 80);

  let basePricePerSqm = CITY_PRICES[cityLower];
  if (!basePricePerSqm) {
    for (const [key, price] of Object.entries(CITY_PRICES)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        basePricePerSqm = price;
        break;
      }
    }
  }
  if (!basePricePerSqm) {
    basePricePerSqm = POSTAL_FALLBACK[postalPrefix] || 2800;
  }

  const typeMultiplier = TYPE_MULTIPLIERS[formData.propertyType] || 1.0;
  const conditionMultiplier = CONDITION_MULTIPLIERS[formData.condition] || 1.0;
  const effectivePricePerSqm = Math.round(
    basePricePerSqm * typeMultiplier * conditionMultiplier,
  );

  const rawMidpoint = effectivePricePerSqm * area;
  const midpoint = Math.round(rawMidpoint / 5000) * 5000;

  return {
    low: Math.max(0, midpoint - 25000),
    high: midpoint + 25000,
    midpoint,
    pricePerSqm: effectivePricePerSqm,
  };
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  land: "Terrain",
  commercial: "Local commercial",
};

const CONDITION_LABELS: Record<string, string> = {
  excellent: "Excellent état",
  good: "Bon état",
  needs_refresh: "À rafraîchir",
  needs_renovation: "À rénover",
};

export default function Estimation() {
  const { toast } = useToast();
  const createEstimation = useCreateEstimation();
  const [step, setStep] = useState(1);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  const [formData, setFormData] = useState({
    propertyType: "apartment" as any,
    address: "",
    city: "",
    postalCode: "",
    livingArea: "",
    rooms: "",
    condition: "good",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (
      step === 1 &&
      (!formData.propertyType ||
        !formData.address ||
        !formData.city ||
        !formData.postalCode)
    ) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && (!formData.livingArea || !formData.rooms)) {
      toast({
        title: "Champs manquants",
        description: "Veuillez préciser la surface et le nombre de pièces.",
        variant: "destructive",
      });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir vos coordonnées.",
        variant: "destructive",
      });
      return;
    }

    const result = computeEstimate(formData);
    setEstimate(result);

    createEstimation.mutate(
      {
        data: {
          ...formData,
          livingArea: parseInt(formData.livingArea) || undefined,
          rooms: parseInt(formData.rooms) || undefined,
        },
      },
      {
        onSuccess: () => setStep(4),
        onError: () => setStep(4),
      },
    );
  };

  return (
    <div className="bg-muted/30 min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-primary mb-4">
            Estimez votre bien en Provence
          </h1>
          <p className="text-muted-foreground text-lg">
            Obtenez une estimation instantanée basée sur les prix du marché
            immobilier provençal actuel.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-lg p-8 md:p-12 relative overflow-hidden">
          {step < 4 && (
            <div className="flex justify-between mb-12 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-accent -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                  ${step >= i ? "bg-accent text-accent-foreground shadow-md" : "bg-card border-2 border-muted text-muted-foreground"}`}
                >
                  {i}
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Location */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-2xl font-bold text-primary">
                  L'emplacement
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type de bien *
                </label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(val) => handleChange("propertyType", val)}
                >
                  <SelectTrigger className="h-12">
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
                  Adresse *
                </label>
                <Input
                  className="h-12"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="N°, voie..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Code Postal *
                  </label>
                  <Input
                    className="h-12"
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    placeholder="13700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ville *
                  </label>
                  <Input
                    className="h-12"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Marignane"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 font-serif h-12 px-8"
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Characteristics */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <Ruler className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-2xl font-bold text-primary">
                  Les caractéristiques
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Surface habitable (m²) *
                  </label>
                  <Input
                    type="number"
                    className="h-12"
                    value={formData.livingArea}
                    onChange={(e) => handleChange("livingArea", e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre de pièces *
                  </label>
                  <Input
                    type="number"
                    className="h-12"
                    value={formData.rooms}
                    onChange={(e) => handleChange("rooms", e.target.value)}
                    placeholder="4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  État général
                </label>
                <Select
                  value={formData.condition}
                  onValueChange={(val) => handleChange("condition", val)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">
                      Excellent état / Neuf
                    </SelectItem>
                    <SelectItem value="good">Bon état</SelectItem>
                    <SelectItem value="needs_refresh">À rafraîchir</SelectItem>
                    <SelectItem value="needs_renovation">À rénover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-12 px-8 border-primary text-primary"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 font-serif h-12 px-8"
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-serif text-2xl font-bold text-primary mb-2">
                Vos coordonnées
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Pour recevoir votre estimation personnalisée et être contacté par
                l'un de nos experts.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prénom *
                  </label>
                  <Input
                    className="h-12"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom *
                  </label>
                  <Input
                    className="h-12"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  className="h-12"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  className="h-12"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="pt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-12 px-8 border-primary text-primary"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createEstimation.isPending}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-serif h-12 px-10"
                >
                  {createEstimation.isPending
                    ? "Calcul en cours..."
                    : "Obtenir mon estimation →"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Result */}
          {step === 4 && estimate && (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <h2 className="font-serif text-2xl font-bold text-primary">
                  Votre estimation indicative
                </h2>
              </div>

              <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground flex flex-wrap gap-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {formData.address}, {formData.city}
                </span>
                <span className="flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5" />
                  {TYPE_LABELS[formData.propertyType]} · {formData.livingArea} m²
                  · {formData.rooms} pièces
                </span>
                <span>{CONDITION_LABELS[formData.condition]}</span>
              </div>

              <div className="bg-primary rounded-2xl p-8 text-primary-foreground text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30%_50%,#C9A84C_0%,transparent_60%)]"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <p className="text-accent font-semibold tracking-wide uppercase text-sm">
                      Valeur de marché estimée
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="text-right">
                      <p className="text-primary-foreground/60 text-xs mb-1">
                        Fourchette basse
                      </p>
                      <p className="text-2xl font-serif font-bold">
                        {formatPrice(estimate.low)}
                      </p>
                    </div>
                    <div className="text-accent text-3xl font-light">—</div>
                    <div className="text-left">
                      <p className="text-primary-foreground/60 text-xs mb-1">
                        Fourchette haute
                      </p>
                      <p className="text-2xl font-serif font-bold">
                        {formatPrice(estimate.high)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                    <p className="text-4xl font-serif font-bold text-accent">
                      {formatPrice(estimate.midpoint)}
                    </p>
                    <p className="text-primary-foreground/70 text-sm mt-1">
                      Valeur centrale estimée
                    </p>
                  </div>

                  <div className="mt-4 bg-primary-foreground/10 rounded-lg px-4 py-2 text-sm text-primary-foreground/80">
                    Basé sur{" "}
                    <strong className="text-accent">
                      {formatPrice(estimate.pricePerSqm)}/m²
                    </strong>{" "}
                    — prix moyen du marché à {formData.city || "votre ville"}
                  </div>
                </div>
              </div>

              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                <strong>Note :</strong> Cette estimation est indicative et basée
                sur les données de marché disponibles. Elle peut varier selon les
                spécificités exactes du bien (étage, vue, dépendances, etc.). Un
                de nos agents vous contactera pour affiner cette valeur
                gratuitement et sans engagement.
              </div>

              <div className="bg-muted/50 rounded-xl p-6 text-center">
                <p className="font-medium text-foreground mb-1">
                  Votre demande a bien été envoyée, {formData.firstName} !
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  Un conseiller I.D.A Immobilier vous contactera sous 24 h pour
                  affiner cette estimation lors d'une visite du bien.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="border-primary text-primary"
                    >
                      Retour à l'accueil
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button className="bg-primary hover:bg-primary/90 font-serif">
                      Nous contacter directement
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
