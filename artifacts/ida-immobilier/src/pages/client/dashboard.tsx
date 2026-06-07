import { useAuth } from "@/contexts/auth";
import { useListFavorites, useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Heart, Bell } from "lucide-react";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { data: favorites } = useListFavorites();
  const { data: appointments } = useListAppointments();

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-primary">Bonjour {user?.firstName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Favoris</CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favorites?.length || 0}</div>
            <p className="text-xs text-muted-foreground">biens sauvegardés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments?.filter(a => a.status === 'confirmed').length || 0}</div>
            <p className="text-xs text-muted-foreground">visites à venir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">recherches actives</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}