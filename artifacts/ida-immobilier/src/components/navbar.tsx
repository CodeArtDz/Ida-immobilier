import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut } from "lucide-react";
import logo from "@assets/full_logo_navbar_1780868246991.png";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/">
          <img src={logo} alt="I.D.A Immobilier" className="h-12 object-contain cursor-pointer" />
        </Link>

        <div className="hidden md:flex space-x-8 items-center text-sm font-medium tracking-wide">
          <Link href="/acheter" className={`hover:text-accent transition-colors ${location === '/acheter' ? 'text-accent' : ''}`}>ACHETER</Link>
          <Link href="/louer" className={`hover:text-accent transition-colors ${location === '/louer' ? 'text-accent' : ''}`}>LOUER</Link>
          <Link href="/estimation" className={`hover:text-accent transition-colors ${location === '/estimation' ? 'text-accent' : ''}`}>ESTIMATION</Link>
          <Link href="/nos-agences" className={`hover:text-accent transition-colors ${location === '/nos-agences' ? 'text-accent' : ''}`}>NOS AGENCES</Link>
          <Link href="/contact" className={`hover:text-accent transition-colors ${location === '/contact' ? 'text-accent' : ''}`}>CONTACT</Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link href={user.role === 'client' ? "/espace-client" : "/tableau-de-bord"}>
                <Button variant="outline" className="text-primary border-primary bg-primary-foreground hover:bg-accent hover:text-accent-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Mon Espace
                </Button>
              </Link>
              <Button variant="ghost" className="text-primary-foreground hover:text-accent hover:bg-transparent" onClick={() => logout()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/connexion">
              <Button variant="outline" className="text-primary border-primary bg-primary-foreground hover:bg-accent hover:text-accent-foreground font-serif">
                Se Connecter
              </Button>
            </Link>
          )}
        </div>

        <Button variant="ghost" className="md:hidden text-primary-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </nav>
  );
}