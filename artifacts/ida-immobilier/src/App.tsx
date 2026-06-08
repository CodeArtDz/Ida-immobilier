import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";

import { PublicLayout } from "@/components/layouts/public-layout";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { ClientLayout } from "@/components/layouts/client-layout";

import Home from "@/pages/home";
import Acheter from "@/pages/acheter";
import Louer from "@/pages/louer";
import Annonce from "@/pages/annonce";
import Estimation from "@/pages/estimation";
import Contact from "@/pages/contact";
import Agences from "@/pages/agences";
import ProgrammesNeufs from "@/pages/programmes-neufs";
import APropos from "@/pages/a-propos";
import Connexion from "@/pages/connexion";
import Inscription from "@/pages/inscription";
import NotFound from "@/pages/not-found";

import ClientDashboard from "@/pages/client/dashboard";
import ClientProfil from "@/pages/client/profil";
import Favoris from "@/pages/client/favoris";
import Alertes from "@/pages/client/alertes";
import RendezVous from "@/pages/client/rendez-vous";
import Messages from "@/pages/client/messages";

import AdminDashboard from "@/pages/admin/dashboard";
import BiensList from "@/pages/admin/biens/index";
import NouveauBien from "@/pages/admin/biens/nouveau";
import EditBien from "@/pages/admin/biens/edit";
import Leads from "@/pages/admin/leads";
import AdminRendezVous from "@/pages/admin/rendez-vous";
import AdminEstimations from "@/pages/admin/estimations";
import AdminMessages from "@/pages/admin/messages";
import AdminAgences from "@/pages/admin/agences";
import AdminUtilisateurs from "@/pages/admin/utilisateurs";
import AdminCRM from "@/pages/admin/crm";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, layout: Layout, allowedRoles }: { component: React.ComponentType, layout: React.ComponentType<{children: React.ReactNode}>, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!user) return <Redirect to="/connexion" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/" />;

  return <Layout><Component /></Layout>;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  return <PublicLayout><Component /></PublicLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Home} />} />
      <Route path="/acheter" component={() => <PublicRoute component={Acheter} />} />
      <Route path="/louer" component={() => <PublicRoute component={Louer} />} />
      <Route path="/annonce/:id" component={() => <PublicRoute component={Annonce} />} />
      <Route path="/estimation" component={() => <PublicRoute component={Estimation} />} />
      <Route path="/contact" component={() => <PublicRoute component={Contact} />} />
      <Route path="/nos-agences" component={() => <PublicRoute component={Agences} />} />
      <Route path="/programmes-neufs" component={() => <PublicRoute component={ProgrammesNeufs} />} />
      <Route path="/a-propos" component={() => <PublicRoute component={APropos} />} />
      
      <Route path="/connexion" component={Connexion} />
      <Route path="/inscription" component={Inscription} />

      <Route path="/espace-client" component={() => <ProtectedRoute component={ClientDashboard} layout={ClientLayout} allowedRoles={['client']} />} />
      <Route path="/espace-client/profil" component={() => <ProtectedRoute component={ClientProfil} layout={ClientLayout} allowedRoles={['client']} />} />
      <Route path="/espace-client/favoris" component={() => <ProtectedRoute component={Favoris} layout={ClientLayout} allowedRoles={['client']} />} />
      <Route path="/espace-client/alertes" component={() => <ProtectedRoute component={Alertes} layout={ClientLayout} allowedRoles={['client']} />} />
      <Route path="/espace-client/rendez-vous" component={() => <ProtectedRoute component={RendezVous} layout={ClientLayout} allowedRoles={['client']} />} />
      <Route path="/espace-client/messages" component={() => <ProtectedRoute component={Messages} layout={ClientLayout} allowedRoles={['client']} />} />
      
      <Route path="/tableau-de-bord" component={() => <ProtectedRoute component={AdminDashboard} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/biens" component={() => <ProtectedRoute component={BiensList} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/biens/nouveau" component={() => <ProtectedRoute component={NouveauBien} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/biens/:id" component={() => <ProtectedRoute component={EditBien} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/leads" component={() => <ProtectedRoute component={Leads} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/rendez-vous" component={() => <ProtectedRoute component={AdminRendezVous} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/estimations" component={() => <ProtectedRoute component={AdminEstimations} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/messages" component={() => <ProtectedRoute component={AdminMessages} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager', 'agent']} />} />
      <Route path="/tableau-de-bord/crm" component={() => <ProtectedRoute component={AdminCRM} layout={AdminLayout} allowedRoles={['admin', 'superadmin', 'agency_manager']} />} />
      <Route path="/tableau-de-bord/agences" component={() => <ProtectedRoute component={AdminAgences} layout={AdminLayout} allowedRoles={['admin', 'superadmin']} />} />
      <Route path="/tableau-de-bord/utilisateurs" component={() => <ProtectedRoute component={AdminUtilisateurs} layout={AdminLayout} allowedRoles={['admin', 'superadmin']} />} />

      <Route component={() => <PublicRoute component={NotFound} />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;