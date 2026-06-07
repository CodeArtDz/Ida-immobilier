import { useGetDashboardAnalytics, useGetCityStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, Calculator } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetDashboardAnalytics();
  const { data: cityStats, isLoading: isLoadingCityStats } = useGetCityStats();

  if (isLoadingAnalytics) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-primary">Vue d'ensemble</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Biens en portefeuille</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.properties.total || 0}</div>
            <p className="text-xs text-muted-foreground">{analytics?.properties.published || 0} publiés en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Leads Actifs</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.leads.total || 0}</div>
            <p className="text-xs text-muted-foreground">{analytics?.leads.new || 0} nouveaux leads à traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.appointments.today || 0}</div>
            <p className="text-xs text-muted-foreground">prévus aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Estimations</CardTitle>
            <Calculator className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.estimations.pending || 0}</div>
            <p className="text-xs text-muted-foreground">demandes en attente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Répartition par ville</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoadingCityStats ? (
                <div className="w-full h-full flex items-center justify-center">Chargement...</div>
              ) : cityStats && cityStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="city" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Nombre de biens" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Aucune donnée</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Pipeline Commercial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex flex-col justify-center gap-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Nouveaux leads</span>
                <span className="font-bold">{analytics?.leads.new || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${Math.min(((analytics?.leads.new || 0) / Math.max(analytics?.leads.total || 1, 1)) * 100, 100)}%` }}></div>
              </div>

              <div className="flex justify-between items-center mb-2 mt-4">
                <span className="font-medium">En contact</span>
                <span className="font-bold">{analytics?.leads.contacted || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div className="bg-yellow-500 h-4 rounded-full" style={{ width: `${Math.min(((analytics?.leads.contacted || 0) / Math.max(analytics?.leads.total || 1, 1)) * 100, 100)}%` }}></div>
              </div>

              <div className="flex justify-between items-center mb-2 mt-4">
                <span className="font-medium">Convertis</span>
                <span className="font-bold">{analytics?.leads.won || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(((analytics?.leads.won || 0) / Math.max(analytics?.leads.total || 1, 1)) * 100, 100)}%` }}></div>
              </div>
              
              <div className="text-center mt-6 text-sm text-muted-foreground">
                Taux de conversion global: <span className="font-bold text-foreground">{analytics?.leads.conversionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}