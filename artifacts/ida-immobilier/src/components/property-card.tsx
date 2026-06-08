import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { MapPin, Bed, Bath, Maximize, ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { Property } from "@workspace/api-client-react";
import { useListPropertyMedia, getListPropertyMediaQueryKey } from "@workspace/api-client-react";
import property1 from "@/assets/images/property-1.png";

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

  const photos = media?.filter((m) => m.type === "photo").map((m) => m.url) ?? [];
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

      {/* Arrows — only on hover with multiple images */}
      {hovered && total > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot indicators */}
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
                    : "w-1.5 h-1.5 bg-white/60 hover:bg-white/90"
                  }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Photo count badge (always visible when multiple) */}
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
  const [, navigate] = useLocation();
  const price = property.salePrice || property.rentalPrice;
  const formattedPrice = price
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(price)
    : "Prix sur demande";

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md"
    >
      {/* Image area — not inside a Link so slider buttons work */}
      <div
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={() => navigate(`/annonce/${property.id}`)}
      >
        <CardSlider
          propertyId={property.id}
          mainImageUrl={property.mainImageUrl}
          title={property.title}
        />

        {/* Transaction badge */}
        <div className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider">
          {property.status === "rented" || property.rentalPrice
            ? "À Louer"
            : "À Vendre"}
        </div>

        {/* DPE badge */}
        {property.dpeRating && (
          <div
            className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
              ${property.dpeRating === "A" ? "bg-green-600" :
                property.dpeRating === "B" ? "bg-green-500" :
                property.dpeRating === "C" ? "bg-green-400" :
                property.dpeRating === "D" ? "bg-yellow-500" :
                property.dpeRating === "E" ? "bg-orange-500" :
                property.dpeRating === "F" ? "bg-orange-600" : "bg-red-600"}`}
          >
            {property.dpeRating}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span
            className="font-serif text-lg font-semibold text-foreground line-clamp-1 hover:text-accent cursor-pointer"
            onClick={() => navigate(`/annonce/${property.id}`)}
          >
            {property.title}
          </span>
          <span className="font-serif text-lg font-bold text-primary ml-4 shrink-0">
            {formattedPrice}
          </span>
        </div>

        <p className="flex items-center text-muted-foreground text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1 shrink-0" />
          <span className="truncate">
            {property.city}, {property.postalCode}
          </span>
        </p>

        <div className="grid grid-cols-3 gap-2 py-4 border-t border-border/50 text-sm text-foreground">
          {property.livingArea && (
            <div className="flex items-center">
              <Maximize className="w-4 h-4 mr-2 text-accent" />
              <span>{property.livingArea} m²</span>
            </div>
          )}
          {property.bedrooms !== null && property.bedrooms !== undefined && (
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-2 text-accent" />
              <span>{property.bedrooms} ch.</span>
            </div>
          )}
          {property.rooms !== null && property.rooms !== undefined && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-2 text-accent" />
              <span>{property.rooms} p.</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
