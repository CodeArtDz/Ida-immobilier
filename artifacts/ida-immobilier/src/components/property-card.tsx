import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import type { Property } from "@workspace/api-client-react";
import property1 from "@/assets/images/property-1.png";

export function PropertyCard({ property }: { property: Property }) {
  const price = property.salePrice || property.rentalPrice;
  const formattedPrice = price ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price) : 'Prix sur demande';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md"
    >
      <Link href={`/annonce/${property.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden cursor-pointer">
          <img 
            src={property.mainImageUrl || property1} 
            alt={property.title} 
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider">
            {property.status === 'rented' || property.rentalPrice ? 'À Louer' : 'À Vendre'}
          </div>
          {property.dpeRating && (
            <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
              ${property.dpeRating === 'A' ? 'bg-green-600' : 
                property.dpeRating === 'B' ? 'bg-green-500' : 
                property.dpeRating === 'C' ? 'bg-green-400' : 
                property.dpeRating === 'D' ? 'bg-yellow-500' : 
                property.dpeRating === 'E' ? 'bg-orange-500' : 
                property.dpeRating === 'F' ? 'bg-orange-600' : 'bg-red-600'}`}
            >
              {property.dpeRating}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/annonce/${property.id}`}>
            <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-1 hover:text-accent cursor-pointer">
              {property.title}
            </h3>
          </Link>
          <span className="font-serif text-lg font-bold text-primary ml-4 shrink-0">
            {formattedPrice}
          </span>
        </div>
        
        <p className="flex items-center text-muted-foreground text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1 shrink-0" />
          <span className="truncate">{property.city}, {property.postalCode}</span>
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