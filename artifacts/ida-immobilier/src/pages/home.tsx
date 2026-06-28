import { motion } from "framer-motion";
import { Search, Home as HomeIcon, KeyRound, Calculator, Handshake, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListFeaturedProperties } from "@workspace/api-client-react";
import { slugify } from "@workspace/seo";
import { PropertyCard } from "@/components/property-card";
import heroBg from "@/assets/images/hero-bg.png";
import estimationVilla from "@/assets/images/estimation-villa.png";
import heroVideo from "@assets/18682412-uhd_3840_2160_25fps_1780936165688.mp4";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";

const SERVICES = [
  {
    icon: HomeIcon,
    title: "Vente Immobilière",
    description:
      "Nous vous accompagnons dans la vente de votre bien avec une expertise locale et une stratégie de diffusion optimisée pour maximiser votre prix de vente.",
    cta: "Mettre en vente",
    href: "/estimation",
  },
  {
    icon: KeyRound,
    title: "Location & Gestion",
    description:
      "Confiez-nous la location et la gestion de votre patrimoine immobilier. Nous sélectionnons les meilleurs locataires et gérons votre bien avec rigueur.",
    cta: "Louer mon bien",
    href: "/contact",
  },
  {
    icon: Calculator,
    title: "Estimation Gratuite",
    description:
      "Obtenez une estimation précise de votre bien en quelques minutes. Notre outil analyse le marché local pour vous donner une évaluation juste et réaliste.",
    cta: "M'estimer",
    href: "/estimation",
  },
  {
    icon: Handshake,
    title: "Accompagnement Acheteur",
    description:
      "Notre équipe d'experts vous guide à chaque étape de votre projet d'achat : recherche, visites, négociation, financement et signature.",
    cta: "Nous contacter",
    href: "/contact",
  },
] as const;

const CITIES = [
  "Marseille",
  "Aix-en-Provence",
  "Marignane",
  "Aubagne",
  "Martigues",
  "Vitrolles",
  "Cassis",
  "La Ciotat",
] as const;

export default function Home() {
  const { data: featuredProperties, isLoading } = useListFeaturedProperties();

  useSeo({
    title: "Agence Immobilière de Prestige en Provence",
    description:
      "Découvrez les biens d'exception I.D.A Immobilier à Marignane, Marseille, Aix-en-Provence. Vente, location, estimation — votre expert immobilier en Provence-Alpes-Côte d'Azur.",
    canonical: "https://ida-immobilier.com/",
  });

  useJsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "I.D.A Immobilier",
    url: "https://ida-immobilier.com",
    description:
      "Agence immobilière de prestige à Marignane, Provence. Achat, vente, location et estimation de biens d'exception.",
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[560px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={heroBg}
            className="w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-primary/50 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-primary/20"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-accent font-semibold uppercase tracking-widest text-xs sm:text-sm mb-4 drop-shadow">
              Marignane — Provence — Méditerranée
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-lg leading-tight">
              L'Excellence<br />Immobilière<br />en Provence
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 text-primary-foreground/85 font-light">
              Vente, location et estimation de biens d'exception à Marignane, Marseille, Aix-en-Provence et dans toute la région.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 font-serif text-base px-8"
            >
              <Link href="/acheter">Acheter un bien</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-primary-foreground/70 text-primary-foreground bg-transparent hover:bg-primary-foreground hover:text-primary font-serif text-base px-8"
            >
              <Link href="/louer">Louer un bien</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-primary-foreground/70 text-primary-foreground bg-transparent hover:bg-primary-foreground hover:text-primary font-serif text-base px-8"
            >
              <Link href="/estimation">Estimer mon bien</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
            className="mt-8 max-w-3xl mx-auto bg-card rounded-lg p-2 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0"
          >
            <div className="flex-1 px-4 sm:border-r border-border">
              <Input
                placeholder="Ville, code postal ou référence..."
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-12 text-foreground"
              />
            </div>
            <div className="sm:px-2">
              <Button className="w-full sm:w-auto h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 rounded-md font-serif text-lg">
                <Search className="mr-2 h-5 w-5" />
                Rechercher
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-accent font-semibold uppercase tracking-widest text-xs sm:text-sm mb-4">
              Services
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
              Votre Partenaire Immobilier de Confiance
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
            <p className="text-muted-foreground">
              I.D.A Immobilier accompagne particuliers et investisseurs dans tous leurs projets immobiliers en Provence, grâce à l'expertise de notre équipe de plus de 20 ans dans le domaine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-background rounded-xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <service.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-serif text-xl font-bold text-primary mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                  {service.description}
                </p>
                <Link
                  href={service.href}
                  className="inline-flex items-center gap-1.5 text-accent font-semibold text-sm hover:gap-2.5 transition-all"
                >
                  {service.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
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

      {/* Secteurs / Cities */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-accent font-semibold uppercase tracking-widest text-xs sm:text-sm mb-4">
              Nos secteurs
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
              Immobilier par Ville
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
            <p className="text-muted-foreground">
              Découvrez notre sélection de biens dans les villes les plus prisées des Bouches-du-Rhône et de la Provence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CITIES.map((city, i) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  href={`/immobilier-${slugify(city)}`}
                  className="group flex items-center gap-3 bg-background rounded-xl px-5 py-4 border border-border shadow-sm hover:border-accent hover:shadow-md transition-all"
                >
                  <MapPin className="w-5 h-5 text-accent shrink-0" />
                  <span className="font-serif font-semibold text-primary group-hover:text-accent transition-colors">
                    {city}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-serif text-base px-8"
            >
              <Link href="/acheter">Voir tous nos biens disponibles</Link>
            </Button>
          </div>
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-accent/30">
              <img
                src={estimationVilla}
                alt="Villa de prestige en Provence"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}