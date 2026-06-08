import { useState, useEffect } from "react";
import { useParams } from "wouter";
import {
  useGetProperty,
  useGetSimilarProperties,
  useListPropertyMedia,
  getGetPropertyQueryKey,
  getGetSimilarPropertiesQueryKey,
  getListPropertyMediaQueryKey,
  useCreateAppointment,
} from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Maximize,
  Bed,
  Bath,
  Mail,
  Phone,
  Calendar,
  Heart,
  X,
  CheckCircle2,
  User,
  ChevronLeft,
  ChevronRight,
  Images,
  Trees,
  Building2,
  Home,
  Layers,
  Sun,
  Waves,
  Car,
  Archive,
  Wind,
  Wifi,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import property1 from "@/assets/images/property-1.png";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Gallery Slider ──────────────────────────────────────────────────────────

function PropertyGallery({
  propertyId,
  mainImageUrl,
  title,
}: {
  propertyId: number;
  mainImageUrl: string | null | undefined;
  title: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: media } = useListPropertyMedia(propertyId, {
    query: { queryKey: getListPropertyMediaQueryKey(propertyId) },
  });

  const photos =
    media?.filter((m) => m.type === "photo").map((m) => m.url) ?? [];
  const images =
    photos.length > 0 ? photos : [mainImageUrl || property1 as string];
  const total = images.length;

  const prev = () => setCurrentIdx((i) => (i - 1 + total) % total);
  const next = () => setCurrentIdx((i) => (i + 1) % total);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxOpen && e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [total, lightboxOpen]);

  return (
    <>
      {/* Main slider */}
      <div className="w-full h-[60vh] bg-muted relative overflow-hidden">
        {images.map((url, idx) => (
          <img
            key={url ?? idx}
            src={url || property1}
            alt={`${title} — ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 cursor-zoom-in select-none
              ${idx === currentIdx ? "opacity-100" : "opacity-0"}`}
            onClick={() => setLightboxOpen(true)}
            draggable={false}
          />
        ))}

        {/* Gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />

        {/* Prev / Next */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Photo counter */}
        {total > 1 && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
            <Images className="w-4 h-4" />
            {currentIdx + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="bg-muted/50 border-b border-border px-4 py-2 flex gap-2 overflow-x-auto scrollbar-thin">
          {images.map((url, idx) => (
            <button
              key={url ?? idx}
              onClick={() => setCurrentIdx(idx)}
              className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 hover:opacity-100
                ${idx === currentIdx
                  ? "border-primary opacity-100 scale-105"
                  : "border-transparent opacity-60"}`}
            >
              <img
                src={url || property1}
                alt={`Miniature ${idx + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={images[currentIdx] || property1}
            alt={`${title} — ${currentIdx + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {currentIdx + 1} / {total} — appuyez sur ← → pour naviguer, Échap pour fermer
          </div>
        </div>
      )}
    </>
  );
}

// ─── Visite Modal ─────────────────────────────────────────────────────────────

function VisiteModal({
  property,
  onClose,
}: {
  property: any;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createAppointment = useCreateAppointment();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    date: "",
    time: "10:00",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.date) {
      toast({
        title: "Champs manquants",
        description: "Prénom, email et date sont requis.",
        variant: "destructive",
      });
      return;
    }
    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    createAppointment.mutate(
      {
        data: {
          type: "visit" as any,
          status: "pending" as any,
          scheduledAt: scheduledAt.toISOString() as any,
          durationMinutes: 60,
          propertyId: property.id,
          agentId: property.currentAgentId || property.ownerAgentId || 1,
          clientId: user?.id,
          clientName: `${form.firstName} ${form.lastName}`,
          clientEmail: form.email,
          clientPhone: form.phone || undefined,
          notes: form.notes || undefined,
        } as any,
      },
      {
        onSuccess: () => setSent(true),
        onError: () =>
          toast({
            title: "Erreur",
            description: "Impossible de planifier la visite.",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-bold text-primary mb-2">
              Demande envoyée !
            </h3>
            <p className="text-muted-foreground mb-2">
              Votre demande a été transmise à{" "}
              <strong>{property.agentName || "votre agent"}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Un conseiller vous confirmera le rendez-vous très prochainement.
            </p>
            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 font-serif"
            >
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="mb-2">
              <h3 className="font-serif text-xl font-bold text-primary">
                Planifier une visite
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {property.title}
              </p>
            </div>

            {property.agentName && (
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {property.agentName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{property.agentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.agencyName || "I.D.A Immobilier"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Prénom *</label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Nom</label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Téléphone</label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+33 6 00 00 00 00"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Date *</label>
                <Input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Heure</label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">
                Message (optionnel)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Questions sur le bien, disponibilités..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              disabled={createAppointment.isPending}
              className="w-full bg-primary hover:bg-primary/90 font-serif h-11"
            >
              {createAppointment.isPending
                ? "Envoi..."
                : "Confirmer la demande"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Annonce() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0");
  const [showVisite, setShowVisite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const { toast } = useToast();

  const { data: property, isLoading } = useGetProperty(propertyId, {
    query: {
      enabled: !!propertyId,
      queryKey: getGetPropertyQueryKey(propertyId),
    },
  });

  const { data: similarProperties } = useGetSimilarProperties(propertyId, {
    query: {
      enabled: !!propertyId && !!property,
      queryKey: getGetSimilarPropertiesQueryKey(propertyId),
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Bien introuvable.
      </div>
    );
  }

  const price = property.salePrice || property.rentalPrice;
  const formattedPrice = price ? formatPrice(price) : "Prix sur demande";
  const isRental = !!property.rentalPrice;

  const TYPE_LABEL: Record<string, string> = {
    apartment: "Appartement",
    house: "Maison",
    villa: "Villa",
    land: "Terrain",
    commercial: "Local commercial",
    garage: "Garage",
    building: "Immeuble",
    programme: "Programme neuf",
    other: "Autre",
  };

  return (
    <div className="bg-background min-h-screen">
      {showVisite && (
        <VisiteModal property={property} onClose={() => setShowVisite(false)} />
      )}

      {/* Gallery Slider + thumbnails */}
      <div className="w-full relative">
        <PropertyGallery
          propertyId={propertyId}
          mainImageUrl={property.mainImageUrl}
          title={property.title}
        />

        {/* Hero overlay content */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none"
          style={{ bottom: 0 }}>
          <div className="container mx-auto px-4 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-auto">
            <div className="text-foreground">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold uppercase tracking-wider rounded-sm">
                  {isRental ? "À Louer" : "À Vendre"}
                </span>
                <span className="bg-accent text-accent-foreground px-3 py-1 text-sm font-semibold rounded-sm">
                  {TYPE_LABEL[property.type] ?? property.type}
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                {property.title}
              </h1>
              <p className="flex items-center text-lg text-foreground/80">
                <MapPin className="w-5 h-5 mr-2" />
                {property.city}, {property.postalCode}
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="font-serif text-4xl md:text-5xl font-bold text-primary">
                {formattedPrice}
                {isRental && (
                  <span className="text-xl font-normal text-foreground/60">
                    {" "}/mois
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                className="bg-background/50 backdrop-blur-md border-border hover:bg-background"
              >
                <Heart className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex flex-wrap gap-6 py-6 border-y border-border">
              {property.livingArea && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Maximize className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surface habitable</p>
                    <p className="font-semibold text-lg">{property.livingArea} m²</p>
                  </div>
                </div>
              )}
              {(property as any).carrezArea && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surface Carrez</p>
                    <p className="font-semibold text-lg">{(property as any).carrezArea} m²</p>
                  </div>
                </div>
              )}
              {(property as any).landArea && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Trees className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Terrain</p>
                    <p className="font-semibold text-lg">{(property as any).landArea} m²</p>
                  </div>
                </div>
              )}
              {property.rooms !== null && property.rooms !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pièces</p>
                    <p className="font-semibold text-lg">{property.rooms}</p>
                  </div>
                </div>
              )}
              {property.bedrooms !== null && property.bedrooms !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Bed className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chambres</p>
                    <p className="font-semibold text-lg">{property.bedrooms}</p>
                  </div>
                </div>
              )}
              {(property as any).bathrooms != null && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Bath className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salles de bains</p>
                    <p className="font-semibold text-lg">{(property as any).bathrooms}</p>
                  </div>
                </div>
              )}
              {(property as any).floor != null && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Étage</p>
                    <p className="font-semibold text-lg">
                      {(property as any).floor}
                      {(property as any).totalFloors ? `/${(property as any).totalFloors}` : ""}
                    </p>
                  </div>
                </div>
              )}
              {(property as any).yearBuilt && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Construction</p>
                    <p className="font-semibold text-lg">{(property as any).yearBuilt}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Description</h2>
              <div className="prose prose-lg text-foreground/80 max-w-none">
                <p className="whitespace-pre-line">
                  {property.fullDescription ||
                    property.shortDescription ||
                    "Aucune description disponible."}
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Prestations</h2>
              {(() => {
                const features = [
                  { key: "hasTerrace", label: "Terrasse", Icon: Sun },
                  { key: "hasBalcony", label: "Balcon", Icon: Building2 },
                  { key: "hasGarden", label: "Jardin", Icon: Trees },
                  { key: "hasPool", label: "Piscine", Icon: Waves },
                  { key: "hasGarage", label: "Garage", Icon: Car },
                  { key: "hasParking", label: "Parking", Icon: Car },
                  { key: "hasCellar", label: "Cave", Icon: Archive },
                  { key: "hasElevator", label: "Ascenseur", Icon: ArrowUpDown },
                  { key: "hasAirConditioning", label: "Climatisation", Icon: Wind },
                  { key: "hasFiber", label: "Fibre optique", Icon: Wifi },
                  { key: "hasFireplace", label: "Cheminée", Icon: Flame },
                ].filter(({ key }) => !!(property as any)[key]);

                return features.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {features.map(({ label, Icon }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-accent/5 border border-accent/20"
                      >
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune prestation renseignée.</p>
                );
              })()}
            </div>

            {(property.dpeRating || property.gesRating) && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-primary mb-6">
                  Diagnostic de Performance Énergétique
                </h2>
                <div className="flex gap-8">
                  {property.dpeRating && (
                    <div className="flex-1 max-w-[200px]">
                      <div className="text-sm font-semibold mb-2">DPE</div>
                      <div
                        className={`w-16 h-16 rounded-md flex items-center justify-center text-white font-bold text-2xl
                        ${property.dpeRating === "A" ? "bg-green-600" :
                          property.dpeRating === "B" ? "bg-green-500" :
                          property.dpeRating === "C" ? "bg-green-400" :
                          property.dpeRating === "D" ? "bg-yellow-500" :
                          property.dpeRating === "E" ? "bg-orange-500" :
                          property.dpeRating === "F" ? "bg-orange-600" : "bg-red-600"}`}
                      >
                        {property.dpeRating}
                      </div>
                    </div>
                  )}
                  {property.gesRating && (
                    <div className="flex-1 max-w-[200px]">
                      <div className="text-sm font-semibold mb-2">GES</div>
                      <div
                        className={`w-16 h-16 rounded-md flex items-center justify-center text-white font-bold text-2xl
                        ${property.gesRating === "A" ? "bg-blue-300" :
                          property.gesRating === "B" ? "bg-blue-400" :
                          property.gesRating === "C" ? "bg-blue-500" :
                          property.gesRating === "D" ? "bg-purple-500" :
                          property.gesRating === "E" ? "bg-purple-600" :
                          property.gesRating === "F" ? "bg-purple-700" : "bg-purple-800"}`}
                      >
                        {property.gesRating}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Agent contact sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl sticky top-24 overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-foreground/20 overflow-hidden shrink-0">
                    {property.agentAvatarUrl ? (
                      <img
                        src={property.agentAvatarUrl}
                        alt={property.agentName || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 opacity-70" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-serif text-lg font-bold">
                      {property.agentName || "Agent I.D.A"}
                    </p>
                    <p className="text-primary-foreground/70 text-sm">
                      {property.agencyName || "I.D.A Immobilier"}
                    </p>
                    <p className="text-accent text-xs font-semibold uppercase tracking-wide mt-1">
                      Conseiller immobilier
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {property.agentPhone ? (
                  <a href={`tel:${property.agentPhone.replace(/\s/g, "")}`}>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal border-primary text-primary h-12 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Phone className="w-5 h-5 mr-3" />
                      <span className="font-medium">{property.agentPhone}</span>
                    </Button>
                  </a>
                ) : (
                  <a href="tel:+33666371737">
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal border-primary text-primary h-12"
                    >
                      <Phone className="w-5 h-5 mr-3" />
                      +33 6 66 37 17 37
                    </Button>
                  </a>
                )}

                {/* Message button → inline form */}
                <Button
                  onClick={() => { setShowContactForm((v) => !v); setContactSent(false); }}
                  className="w-full justify-start font-normal bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Envoyer un message
                </Button>

                {/* Inline contact form */}
                {showContactForm && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    {contactSent ? (
                      <div className="p-5 text-center">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                        <p className="font-serif font-bold text-primary mb-1">Message envoyé !</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {property.agentName || "Votre conseiller"} a bien reçu votre message. Un email de confirmation a également été transmis.
                        </p>
                        <button
                          onClick={() => { setContactSent(false); setShowContactForm(false); setContactForm({ name: "", email: "", phone: "", message: "" }); }}
                          className="text-xs text-primary underline"
                        >
                          Fermer
                        </button>
                      </div>
                    ) : (
                      <form
                        className="p-4 space-y-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!contactForm.name || !contactForm.email || !contactForm.message) {
                            toast({ title: "Champs requis", description: "Veuillez remplir nom, email et message.", variant: "destructive" });
                            return;
                          }
                          setContactSending(true);
                          try {
                            const res = await fetch(`/api/contact/property/${propertyId}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: contactForm.name, email: contactForm.email, phone: contactForm.phone || undefined, message: contactForm.message }),
                            });
                            if (!res.ok) throw new Error();
                            setContactSent(true);
                          } catch {
                            toast({ title: "Erreur", description: "Impossible d'envoyer le message. Réessayez.", variant: "destructive" });
                          } finally {
                            setContactSending(false);
                          }
                        }}
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Contacter {property.agentName || "le conseiller"}
                        </p>
                        <Input
                          placeholder="Votre nom *"
                          value={contactForm.name}
                          onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-9 text-sm"
                          required
                        />
                        <Input
                          type="email"
                          placeholder="Votre email *"
                          value={contactForm.email}
                          onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                          className="h-9 text-sm"
                          required
                        />
                        <Input
                          type="tel"
                          placeholder="Téléphone (optionnel)"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                          className="h-9 text-sm"
                        />
                        <textarea
                          placeholder={`Bonjour, je suis intéressé(e) par ce bien (Réf. IDA-${propertyId})...`}
                          value={contactForm.message}
                          onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                          rows={4}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          En envoyant ce message, votre demande est enregistrée dans notre plateforme et transmise par email à votre conseiller ainsi qu'à notre équipe.
                        </p>
                        <Button
                          type="submit"
                          disabled={contactSending}
                          className="w-full bg-primary hover:bg-primary/90 h-10 font-serif text-sm"
                        >
                          {contactSending ? "Envoi en cours…" : "Envoyer"}
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setShowVisite(true)}
                  className="w-full justify-start font-normal bg-accent hover:bg-accent/90 text-accent-foreground h-12 font-serif"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  Planifier une visite
                </Button>
              </div>

              <div className="px-6 pb-6 text-sm text-muted-foreground border-t border-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Référence</span>
                  <span className="font-mono text-foreground">IDA-{property.id}</span>
                </div>
                {property.agencyFees && (
                  <div className="flex justify-between">
                    <span>Honoraires TTC</span>
                    <span className="text-foreground">
                      {formatPrice(property.agencyFees)}
                    </span>
                  </div>
                )}
                {property.charges && (
                  <div className="flex justify-between">
                    <span>Charges mensuelles</span>
                    <span className="text-foreground">
                      {formatPrice(property.charges)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {similarProperties && similarProperties.length > 0 && (
          <div className="mt-24">
            <h2 className="font-serif text-3xl font-bold text-primary mb-8">
              Biens similaires
            </h2>
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
