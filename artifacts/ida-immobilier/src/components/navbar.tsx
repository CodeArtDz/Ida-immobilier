import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, X } from "lucide-react";
import logo from "@assets/full_logo_navbar_1780868246991.png";

const NAV_LINKS = [
  { href: "/acheter", label: "ACHETER" },
  { href: "/louer", label: "LOUER" },
  { href: "/programmes-neufs", label: "PROGRAMMES NEUFS" },
  { href: "/estimation", label: "ESTIMATION" },
  { href: "/blog", label: "BLOG" },
  { href: "/contact", label: "CONTACT" },
  { href: "/a-propos", label: "À PROPOS" },
];

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/">
          <img
            src={logo}
            alt="I.D.A Immobilier"
            className="h-12 object-contain cursor-pointer"
          />
        </Link>

        <div className="hidden md:flex space-x-6 items-center text-sm font-medium tracking-wide">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`hover:text-accent transition-colors whitespace-nowrap ${location === href ? "text-accent" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                href={
                  user.role === "client"
                    ? "/espace-client"
                    : "/tableau-de-bord"
                }
              >
                <Button
                  variant="outline"
                  className="text-primary border-primary bg-primary-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <User className="mr-2 h-4 w-4" />
                  Mon Espace
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:text-accent hover:bg-transparent"
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/connexion">
              <Button
                variant="outline"
                className="text-primary border-primary bg-primary-foreground hover:bg-accent hover:text-accent-foreground font-serif"
              >
                Se Connecter
              </Button>
            </Link>
          )}
        </div>

        <Button
          variant="ghost"
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
          aria-controls="primary-mobile-nav"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {mobileOpen && (
        <div id="primary-mobile-nav" className="md:hidden bg-primary border-t border-primary-foreground/10 px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block text-sm font-medium py-2 hover:text-accent transition-colors ${location === href ? "text-accent" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-primary-foreground/10">
            {user ? (
              <div className="flex gap-3">
                <Link
                  href={
                    user.role === "client"
                      ? "/espace-client"
                      : "/tableau-de-bord"
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-primary border-primary bg-primary-foreground"
                  >
                    Mon Espace
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary-foreground"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-1" /> Déconnexion
                </Button>
              </div>
            ) : (
              <Link href="/connexion" onClick={() => setMobileOpen(false)}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-primary border-primary bg-primary-foreground"
                >
                  Se Connecter
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
