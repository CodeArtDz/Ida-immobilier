import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Heart, Bell, Calendar, MessageSquare, LogOut, User } from "lucide-react";
import logo from "@assets/full_logo_navbar_1780868246991.png";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Mon Profil', href: '/espace-client', icon: User },
    { name: 'Favoris', href: '/espace-client/favoris', icon: Heart },
    { name: 'Alertes', href: '/espace-client/alertes', icon: Bell },
    { name: 'Rendez-vous', href: '/espace-client/rendez-vous', icon: Calendar },
    { name: 'Messages', href: '/espace-client/messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground h-20 flex items-center px-4 md:px-8 justify-between">
        <Link href="/">
          <img src={logo} alt="I.D.A Immobilier" className="h-10 md:h-12 cursor-pointer" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm font-medium">
            Bienvenue, {user?.firstName}
          </div>
          <Button variant="ghost" className="text-primary-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => { logout(); window.location.href = "/"; }}>
            <LogOut className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Déconnexion</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row container mx-auto px-4 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  }`}>
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}