import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Calendar, 
  MessageSquare, 
  LogOut, 
  Calculator,
  UserCog,
  UsersRound,
  CircleUser,
  Menu,
  X
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { NotificationBell } from "@/components/notification-bell";
import logo from "@assets/full_logo_navbar_1780868246991.png";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/tableau-de-bord', icon: LayoutDashboard },
    { name: 'Biens', href: '/tableau-de-bord/biens', icon: Building2 },
    { name: 'Leads', href: '/tableau-de-bord/leads', icon: Users },
    { name: 'Rendez-vous', href: '/tableau-de-bord/rendez-vous', icon: Calendar },
    { name: 'Estimations', href: '/tableau-de-bord/estimations', icon: Calculator },
    { name: 'Messages', href: '/tableau-de-bord/messages', icon: MessageSquare },
  ];

  if (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'agency_manager') {
    navigation.push({ name: 'CRM', href: '/tableau-de-bord/crm', icon: UsersRound });
  }
  if (user?.role === 'superadmin' || user?.role === 'admin') {
    navigation.push(
      { name: 'Agences', href: '/tableau-de-bord/agences', icon: Building2 },
      { name: 'Personnel', href: '/tableau-de-bord/utilisateurs', icon: UserCog }
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col">
        <div className="h-20 flex items-center justify-between px-6 border-b border-sidebar-border bg-sidebar">
          <Link href="/">
            <img src={logo} alt="I.D.A Immobilier" className="h-10 cursor-pointer" />
          </Link>
          <NotificationBell triggerClassName="text-sidebar-foreground hover:bg-sidebar-accent hover:text-white" />
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/tableau-de-bord');
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-primary' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}>
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <Link href="/tableau-de-bord/profil">
            <div className="flex items-center px-4 py-3 mb-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
              {(user as any)?.avatarUrl ? (
                <img
                  src={`/api/storage${(user as any).avatarUrl}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-sidebar-border shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              )}
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-sidebar-foreground/60">{({"superadmin":"Super Admin","admin":"Administrateur","agency_manager":"Directeur d'agence","agent":"Agent","client":"Client"} as Record<string,string>)[user?.role ?? ""] ?? user?.role}</p>
              </div>
              <CircleUser className="ml-auto w-4 h-4 text-sidebar-foreground/40 shrink-0" />
            </div>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            onClick={() => { logout(); window.location.href = "/"; }}
          >
            <LogOut className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:hidden">
          <img src={logo} alt="I.D.A" className="h-8" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
              aria-controls="admin-mobile-nav"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </header>

        {mobileOpen && (
          <div id="admin-mobile-nav" className="md:hidden bg-sidebar text-sidebar-foreground border-b border-sidebar-border px-3 py-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/tableau-de-bord');
              return (
                <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}>
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'}`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-sidebar-border space-y-1">
              <Link href="/tableau-de-bord/profil" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer hover:bg-sidebar-accent/50">
                  <CircleUser className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                  Mon profil
                </div>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                onClick={() => { logout(); window.location.href = "/"; }}
              >
                <LogOut className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                Déconnexion
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
      </div>
      <Footer />
    </div>
  );
}