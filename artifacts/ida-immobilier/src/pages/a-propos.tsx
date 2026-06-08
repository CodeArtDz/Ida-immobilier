import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSeo } from "@/hooks/use-seo";
import { useJsonLd } from "@/hooks/use-json-ld";
import { Button } from "@/components/ui/button";
import logoSquare from "@assets/full_logo3__1780868246992.png";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Award,
  Users,
  Home,
  TrendingUp,
} from "lucide-react";

const VALEURS = [
  {
    icon: Award,
    title: "Excellence",
    desc: "Nous sélectionnons uniquement des biens d'exception qui correspondent aux standards les plus exigeants de la clientèle haut de gamme.",
  },
  {
    icon: Users,
    title: "Proximité",
    desc: "Ancrés à Marignane depuis notre fondation, nos agents connaissent chaque quartier, chaque rue, chaque opportunité du marché local.",
  },
  {
    icon: Home,
    title: "Expertise",
    desc: "Vente, location, gestion et estimation : nous maîtrisons toutes les facettes de l'immobilier provençal, du studio à la villa de prestige.",
  },
  {
    icon: TrendingUp,
    title: "Résultats",
    desc: "Notre méthode rigoureuse d'évaluation et notre réseau étendu garantissent les meilleures conditions pour chaque transaction.",
  },
];

const STATS = [
  { value: "350+", label: "Biens vendus" },
  { value: "15+", label: "Années d'expérience" },
  { value: "98%", label: "Clients satisfaits" },
  { value: "3", label: "Agences en Provence" },
];

export default function APropos() {
  useSeo({
    title: "À propos de I.D.A Immobilier — Notre histoire",
    description:
      "Fondée à Marignane, I.D.A Immobilier est votre agence de confiance pour l'immobilier de prestige en Provence. Excellence, proximité et expertise depuis plus de 15 ans.",
    canonical: "https://ida-immobilier.com/a-propos",
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://ida-immobilier.com/" },
      { "@type": "ListItem", position: 2, name: "À propos", item: "https://ida-immobilier.com/a-propos" },
    ],
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_70%_30%,#C9A84C_0%,transparent_60%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-4">
              Notre histoire
            </p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">
              I.D.A Immobilier
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl leading-relaxed mb-8">
              Agence immobilière de référence à Marignane, nous accompagnons
              depuis plus de 15 ans les familles et investisseurs dans leurs
              projets immobiliers en Provence et sur le pourtour méditerranéen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-accent/10 border-y border-accent/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-serif text-4xl font-bold text-primary mb-1">
                  {value}
                </p>
                <p className="text-muted-foreground text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-6">
                Notre histoire
              </h2>
              <div className="w-16 h-1 bg-accent mb-8"></div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Fondée à Marignane au cœur de la Provence, I.D.A Immobilier
                  est née d'une passion profonde pour l'immobilier d'exception et
                  d'un attachement sincère à notre territoire méditerranéen.
                </p>
                <p>
                  Notre équipe d'agents certifiés maîtrise les spécificités du
                  marché local — de Marignane à Marseille, d'Aix-en-Provence aux
                  communes du Pays de l'Étang de Berre — pour vous offrir un
                  accompagnement personnalisé et transparent à chaque étape de
                  votre projet.
                </p>
                <p>
                  Que vous cherchiez à vendre, acquérir, louer ou faire estimer
                  votre bien, nos experts mobilisent leur connaissance fine du
                  terrain et leur réseau étendu pour garantir les meilleures
                  conditions de transaction.
                </p>
              </div>
              <div className="mt-8">
                <Link href="/estimation">
                  <Button className="bg-primary hover:bg-primary/90 font-serif">
                    Estimer mon bien gratuitement
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8">
              <img
                src={logoSquare}
                alt="I.D.A Immobilier"
                className="w-48 h-48 object-contain"
              />
              <div className="bg-primary text-primary-foreground rounded-2xl p-8 w-full">
                <h3 className="font-serif text-xl font-bold mb-6 text-accent">
                  Nous contacter
                </h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-primary-foreground/70 text-sm mt-0.5">
                        16 av de la 1ère armée française
                        <br />
                        13700 Marignane, France
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-accent shrink-0" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a
                        href="tel:+33666371737"
                        className="text-primary-foreground/70 text-sm hover:text-accent transition-colors"
                      >
                        +33 6 66 37 17 37
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-accent shrink-0" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <a
                        href="mailto:contact@ida-immobilier.com"
                        className="text-primary-foreground/70 text-sm hover:text-accent transition-colors"
                      >
                        contact@ida-immobilier.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Horaires</p>
                      <p className="text-primary-foreground/70 text-sm mt-0.5">
                        Lun–Ven : 9h00 – 18h30
                        <br />
                        Sam : 9h00 – 13h00
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
              Nos valeurs
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALEURS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary mb-2">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="font-serif text-3xl font-bold mb-4">
            Votre projet commence ici
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Contactez nos conseillers pour un premier échange gratuit et
            confidentiel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-serif"
              >
                Prendre contact
              </Button>
            </Link>
            <Link href="/estimation">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Estimer mon bien
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
