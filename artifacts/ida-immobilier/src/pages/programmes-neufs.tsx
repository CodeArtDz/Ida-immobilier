import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  ShieldCheck,
  Banknote,
  KeyRound,
  Leaf,
  Phone,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const AVANTAGES = [
  {
    icon: Banknote,
    title: "Frais de notaire réduits",
    desc: "Entre 2 et 3 % du prix d'acquisition contre 7 à 8 % dans l'ancien.",
  },
  {
    icon: ShieldCheck,
    title: "Garanties constructeur",
    desc: "Garantie décennale, biennale et de parfait achèvement incluses.",
  },
  {
    icon: Leaf,
    title: "Performances énergétiques",
    desc: "Conformité RE2020 : économies d'énergie et confort thermique optimal.",
  },
  {
    icon: KeyRound,
    title: "Personnalisation",
    desc: "Choix des finitions, cuisines et revêtements selon vos préférences.",
  },
  {
    icon: Building2,
    title: "Dispositifs fiscaux",
    desc: "Éligibilité Pinel+ et TVA réduite à 5,5 % en zone ANRU.",
  },
  {
    icon: CheckCircle2,
    title: "Aucun travaux immédiats",
    desc: "Logement livré clé en main, conforme aux dernières normes.",
  },
];

const PROGRAMMES = [
  {
    name: "Résidence Les Jardins de Provence",
    city: "Marignane",
    type: "Appartements T2 à T4",
    livraison: "T4 2025",
    prix: "À partir de 195 000 €",
    disponible: true,
  },
  {
    name: "Villa Méditerranée",
    city: "Aix-en-Provence",
    type: "Villas T4 & T5",
    livraison: "T2 2026",
    prix: "À partir de 480 000 €",
    disponible: true,
  },
  {
    name: "Le Clos Saint-Victoret",
    city: "Saint-Victoret",
    type: "Maisons T3 à T5",
    livraison: "T1 2026",
    prix: "À partir de 310 000 €",
    disponible: true,
  },
];

export default function ProgrammesNeufs() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({
        title: "Champs manquants",
        description: "Veuillez indiquer votre nom et votre email.",
        variant: "destructive",
      });
      return;
    }
    setSent(true);
    toast({
      title: "Demande envoyée",
      description: "Un conseiller vous contactera très prochainement.",
    });
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_60%_40%,#C9A84C_0%,transparent_65%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-4">
              Immobilier Neuf en Provence
            </p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Programmes Neufs
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 leading-relaxed">
              Découvrez notre sélection exclusive de programmes neufs à
              Marignane, Aix-en-Provence et dans toute la région
              méditerranéenne. Investissez dans un logement moderne avec toutes
              les garanties du neuf.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#programmes">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-serif"
                >
                  Voir les programmes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#contact-neuf">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Être contacté
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
              Les avantages du neuf
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Acheter dans le neuf, c'est bénéficier de nombreux avantages
              financiers et pratiques que l'ancien ne peut pas offrir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVANTAGES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary mb-2">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section id="programmes" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
              Nos programmes disponibles
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROGRAMMES.map((p) => (
              <div
                key={p.name}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-primary/10 flex items-center justify-center relative">
                  <Building2 className="w-16 h-16 text-primary/30" />
                  {p.disponible && (
                    <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      Disponible
                    </span>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-serif text-lg font-bold text-primary leading-tight">
                    {p.name}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        Ville :
                      </span>{" "}
                      {p.city}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Type :
                      </span>{" "}
                      {p.type}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Livraison :
                      </span>{" "}
                      {p.livraison}
                    </p>
                  </div>
                  <p className="text-accent font-serif font-bold text-xl pt-1">
                    {p.prix}
                  </p>
                  <a href="#contact-neuf">
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-primary hover:bg-primary/90 font-serif"
                    >
                      Demander des informations
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact-neuf" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-primary mb-4">
              Vous avez un projet dans le neuf ?
            </h2>
            <p className="text-muted-foreground">
              Nos conseillers spécialisés vous accompagnent de la recherche du
              programme à la remise des clés.
            </p>
          </div>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold text-primary mb-2">
                Demande envoyée !
              </h3>
              <p className="text-muted-foreground">
                Un conseiller vous contactera dans les 24 heures.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-xl p-8 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom complet *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Téléphone
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+33 6 00 00 00 00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="jean@exemple.fr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Votre projet
                </label>
                <Textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Résidence principale, investissement locatif, budget, délai..."
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 font-serif h-12 text-base"
              >
                <Phone className="mr-2 h-4 w-4" />
                Être rappelé par un conseiller
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
