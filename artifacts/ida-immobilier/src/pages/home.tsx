import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListFeaturedProperties } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property-card";
import heroBg from "@/assets/images/hero-bg.png";

export default function Home() {
  const { data: featuredProperties, isLoading } = useListFeaturedProperties();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Luxury Villa Provence" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-lg">
              L'Art de Vivre en Provence
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-primary-foreground/90 font-light">
              Découvrez notre collection exclusive de propriétés de prestige à travers Marseille, Aix-en-Provence et ses environs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="max-w-3xl mx-auto bg-card rounded-lg p-2 shadow-xl flex items-center"
          >
            <div className="flex-1 px-4 border-r border-border">
              <Input 
                placeholder="Ville, code postal ou référence..." 
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-12 text-foreground"
              />
            </div>
            <div className="px-2">
              <Button className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 rounded-md font-serif text-lg">
                <Search className="mr-2 h-5 w-5" />
                Rechercher
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">Notre Sélection Exclusive</h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des demeures d'exception choisies pour leur caractère unique, leur emplacement privilégié et leurs prestations haut de gamme.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : featuredProperties && featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Aucun bien mis en avant pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* Estimation CTA */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Combien vaut votre bien aujourd'hui ?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Bénéficiez de l'expertise de nos agents pour une estimation précise et confidentielle de votre propriété en Provence.
            </p>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-serif text-lg px-8">
              Demander une estimation
            </Button>
          </div>
          <div className="hidden md:block">
            {/* Abstract decorative element for the CTA */}
            <div className="w-full aspect-square rounded-full border-4 border-accent/20 flex items-center justify-center p-8">
              <div className="w-full h-full rounded-full border-4 border-accent/40 flex items-center justify-center p-8">
                 <div className="w-full h-full rounded-full bg-accent/10 flex items-center justify-center">
                   <span className="font-serif text-6xl text-accent font-bold">I.D.A</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}