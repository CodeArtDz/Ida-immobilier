import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Heart, Bell, Calendar, MessageSquare, LogOut, User, LayoutDashboard } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const navigation = [
  { name: "Mon Espace", href: "/espace-client", icon: LayoutDashboard },
  { name: "Mon Profil", href: "/espace-client/profil", icon: User },
  { name: "Favoris", href: "/espace-client/favoris", icon: Heart },
  { name: "Alertes", href: "/espace-client/alertes", icon: Bell },
  { name: "Rendez-vous", href: "/espace-client/rendez-vous", icon: Calendar },
  { name: "Messages", href: "/espace-client/messages", icon: MessageSquare },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-60 shrink-0">
            <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-24">
              {/* User info */}
              <div className="bg-primary/5 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-lg shrink-0">
                    {user?.firstName?.[0]?.toUpperCase() ?? "C"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors
                          ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"}`}
                      >
                        <item.icon
                          className={`mr-3 h-4 w-4 shrink-0
                            ${isActive ? "text-accent" : "text-muted-foreground"}`}
                        />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-normal"
                  onClick={() => {
                    logout();
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
