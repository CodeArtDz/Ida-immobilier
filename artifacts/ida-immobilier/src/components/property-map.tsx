import { useEffect, useRef, useState } from "react";
import type { Property } from "@workspace/api-client-react";

// Leaflet is loaded dynamically to avoid SSR issues with Vite
// We import the types but load the actual library in useEffect
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

interface PropertyMapProps {
  properties: Property[];
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(".0", "")}M€`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}k€`;
  return `${price}€`;
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, LeafletMarker>>(new Map());
  const [selected, setSelected] = useState<Property | null>(null);

  // Properties with valid coordinates
  const mappable = properties.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  // Centre on Provence region
  const defaultCenter: [number, number] = [43.42, 5.22];
  const defaultZoom = 10;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
      });

      mapRef.current = map;

      // CartoDB Positron — clean, elegant light tile
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // Add markers
      mappable.forEach((property) => {
        const price = property.salePrice || property.rentalPrice || 0;
        const priceLabel = price ? formatPrice(price) : "—";

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background: #0f2044;
            color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 20px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 2px solid #0f2044;
            cursor: pointer;
            transition: all 0.15s;
            position: relative;
          ">${priceLabel}<span style="
            position: absolute;
            bottom: -7px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #0f2044;
          "></span></div>`,
          iconAnchor: [0, 0],
        });

        const marker = L.marker([property.latitude!, property.longitude!], {
          icon,
        }).addTo(map);

        marker.on("click", () => {
          setSelected(property);
          // Highlight selected marker
          markersRef.current.forEach((m, id) => {
            const el = m.getElement()?.querySelector("div") as HTMLElement | null;
            if (el) {
              el.style.background = id === property.id ? "#c9a84c" : "#0f2044";
              el.style.borderColor = id === property.id ? "#c9a84c" : "#0f2044";
              const arrow = el.querySelector("span") as HTMLElement | null;
              if (arrow)
                arrow.style.borderTopColor =
                  id === property.id ? "#c9a84c" : "#0f2044";
            }
          });
        });

        markersRef.current.set(property.id, marker);
      });

      // Fit bounds to all markers
      if (mappable.length > 0) {
        const bounds = L.latLngBounds(
          mappable.map((p) => [p.latitude!, p.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
      }
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!mapRef.current) return;
    // Simple approach: markers stay, selection highlight updates
  }, [properties]);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden border border-border" />

      {/* No coordinates warning */}
      {mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-xl">
          <p className="text-muted-foreground">Aucun bien avec coordonnées GPS disponible.</p>
        </div>
      )}

      {/* Property popup panel */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-card border border-border rounded-xl shadow-2xl p-4 flex gap-4 items-center max-w-lg mx-auto">
          {/* Thumbnail */}
          <a
            href={`/annonce/${selected.id}`}
            className="w-24 h-20 rounded-lg overflow-hidden shrink-0 block"
          >
            <img
              src={selected.mainImageUrl || ""}
              alt={selected.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.background = "#e5e7eb";
              }}
            />
          </a>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <a
              href={`/annonce/${selected.id}`}
              className="font-serif text-sm font-bold text-primary line-clamp-2 hover:underline block"
            >
              {selected.title}
            </a>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selected.city}, {selected.postalCode}
            </p>
            <p className="font-serif text-base font-bold text-primary mt-1">
              {(selected.salePrice || selected.rentalPrice)
                ? new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(selected.salePrice || selected.rentalPrice || 0)
                : "Prix sur demande"}
              {selected.rentalPrice && (
                <span className="text-xs font-normal text-muted-foreground"> /mois</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <a
              href={`/annonce/${selected.id}`}
              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-center"
            >
              Voir le bien
            </a>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground text-xs hover:text-foreground transition-colors text-center"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Count badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border text-xs text-muted-foreground px-3 py-1.5 rounded-full shadow-sm">
        {mappable.length} bien{mappable.length > 1 ? "s" : ""} sur la carte
      </div>
    </div>
  );
}
