import { Link } from "wouter";
import logoSquare from "@assets/full_logo3__1780868246992.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16 border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="flex flex-col items-center md:items-start space-y-4">
          <img src={logoSquare} alt="I.D.A Immobilier" className="h-24 object-contain" />
          <p className="text-sm text-primary-foreground/70 text-center md:text-left">
            L'excellence immobilière en Provence. Une institution de confiance pour vos projets d'exception.
          </p>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-accent">Navigation</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/acheter" className="hover:text-accent transition-colors">Acheter</Link></li>
            <li><Link href="/louer" className="hover:text-accent transition-colors">Louer</Link></li>
            <li><Link href="/programmes-neufs" className="hover:text-accent transition-colors">Programmes Neufs</Link></li>
            <li><Link href="/estimation" className="hover:text-accent transition-colors">Faire estimer son bien</Link></li>
            <li><Link href="/a-propos" className="hover:text-accent transition-colors">À Propos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-accent">Légal</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/mentions-legales" className="hover:text-accent transition-colors">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-accent transition-colors">Politique de confidentialité</Link></li>
            <li><Link href="/cgu" className="hover:text-accent transition-colors">Conditions générales</Link></li>
            <li><Link href="/honoraires" className="hover:text-accent transition-colors">Barème des honoraires</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-accent">Contact</h4>
          <ul className="space-y-4 text-sm text-primary-foreground/80">
            <li>16 av de la 1ère armée française<br />13700 Marignane, France</li>
            <li><a href="tel:+33666371737" className="hover:text-accent transition-colors">+33 6 66 37 17 37</a></li>
            <li><a href="mailto:contact@ida-immobilier.com" className="hover:text-accent transition-colors">contact@ida-immobilier.com</a></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
        &copy; {new Date().getFullYear()} I.D.A Immobilier. Tous droits réservés.
      </div>
    </footer>
  );
}