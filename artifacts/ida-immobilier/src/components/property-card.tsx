import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, Bed, Maximize, ChevronLeft, ChevronRight, Images, Trees, Home, Building2 } from "lucide-react";
import type { Property } from "@workspace/api-client-react";
import { useListPropertyMedia, getListPropertyMediaQueryKey } from "@workspace/api-client-react";
import property1 from "@/assets/images/property-1.png";

const DPE_COLOR: Record<string, string> = {
  A: "bg-green-600", B: "bg-green-500", C: "bg-green-400",
  D: "bg-yellow-500", E: "bg-orange-500", F: "bg-orange-600", G: "bg-red-600",
};

function CardSlider({ propertyId, mainImageUrl, title }: {
  propertyId: number;
  mainImageUrl: string | null | undefined;
  title: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const { data: media } = useListPropertyMedia(propertyId, {
    query: {
      enabled: hovered,
      queryKey: getListPropertyMediaQueryKey(propertyId),
    },
  });

  const photos =
    media?.filter((m) => m.type === "photo").map((m) => m.watermarkedUrl || m.url) ?? [];
  const images = photos.length > 0 ? photos : [mainImageUrl || property1];
  const total = images.length;

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((i) => (i - 1 + total) % total);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((i) => (i + 1) % total);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-muted"
      onMouseEnter={() => setHovered(true)}
    >
      {images.map((url, idx) => (
        <img
          key={url ?? idx}
          src={url || property1}
          alt={`${title} — photo ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
            ${idx === currentIdx ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      {hovered && total > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 items-center">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIdx(idx);
                }}
                className={`rounded-full transition-all duration-200
                  ${idx === currentIdx
                    ? "w-4 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/60 hover:bg-white/90"}`}
              />
            ))}
          </div>
        </>
      )}

      {total > 1 && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          <Images className="w-3 h-3" />
          {total}
        </div>
      )}
    </div>
  );
}

export function PropertyCard({ property }: { property: Property }) {
  const price = property.salePrice || property.rentalPrice;
  const formattedPrice = price
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(price)
    : "Prix sur demande";

  const p = property as any;

  const featurePills = [
    p.hasTerrace && "Terrasse",
    p.hasPool && "Piscine",
    p.hasGarden && "Jardin",
    p.hasParking && "Parking",
    p.hasGarage && "Garage",
    p.hasBalcony && "Balcon",
    p.hasAirConditioning && "Clim.",
    p.hasElevator && "Ascenseur",
  ].filter(Boolean).slice(0, 4) as string[];

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md"
    >
      <Link
        href={`/annonce/${property.id}`}
        className="relative aspect-[4/3] overflow-hidden block"
      >
        <CardSlider
          propertyId={property.id}
          mainImageUrl={property.mainImageUrl}
          title={property.title}
        />

        <div className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider">
          {property.status === "rented" || property.rentalPrice ? "À Louer" : "À Vendre"}
        </div>

        {property.dpeRating && (
          <div className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${DPE_COLOR[property.dpeRating] ?? "bg-gray-500"}`}>
            {property.dpeRating}
          </div>
        )}
      </Link>

      <div className="p-5">
        <div className="flex justify-between items-start mb-1.5">
          <Link
            href={`/annonce/${property.id}`}
            className="font-serif text-lg font-semibold text-foreground line-clamp-1 hover:text-accent"
          >
            {property.title}
          </Link>
          <span className="font-serif text-lg font-bold text-primary ml-3 shrink-0">
            {formattedPrice}
            {property.rentalPrice && <span className="text-xs font-normal text-muted-foreground">/mois</span>}
          </span>
        </div>

        <p className="flex items-center text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span className="truncate">{property.city}, {property.postalCode}</span>
        </p>

        {/* Key stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-3 border-t border-border/50 text-sm text-foreground">
          {property.livingArea && (
            <div className="flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-accent" />
              <span>{property.livingArea} m²</span>
            </div>
          )}
          {p.landArea && (property.type === "land" || property.type === "house" || property.type === "villa") && (
            <div className="flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-accent" />
              <span>{p.landArea} m²</span>
            </div>
          )}
          {property.bedrooms != null && (
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-accent" />
              <span>{property.bedrooms} ch.</span>
            </div>
          )}
          {property.rooms != null && (
            <div className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-accent" />
              <span>{property.rooms} p.</span>
            </div>
          )}
          {p.floor != null && property.type === "apartment" && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span>Étage {p.floor}</span>
            </div>
          )}
        </div>

        {/* Feature pills */}
        {featurePills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
            {featurePills.map((feat) => (
              <span
                key={feat}
                className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium"
              >
                {feat}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
