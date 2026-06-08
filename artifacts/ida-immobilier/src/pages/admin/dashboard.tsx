import { useGetDashboardAnalytics, useGetCityStats } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, Calculator, Eye, Globe, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface WebsiteStats {
  totalViews: number;
  topProperties: Array<{ id: number; title: string; city: string; viewCount: number; status: string }>;
  seo: { total: number; withTitle: number; withDescription: number; titlePercent: number; descPercent: number };
  leadSources: Array<{ source: string; label: string; count: number }>;
}

const useWebsiteAnalytics = () =>
  useQuery<WebsiteStats>({
    queryKey: ["analytics", "website"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const res = await fetch(`${base}/api/analytics/website`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

const SOURCE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#8b5cf6", "#f59e0b", "#10b981"];

const STATUS_FR: Record<string, string> = {
  published: "Publié",
  draft: "Brouillon",
  reserved: "Réservé",
  sold: "Vendu",
};

function SeoBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${percent >= 80 ? "text-green-600" : percent >= 50 ? "text-amber-600" : "text-red-600"}`}>
          {percent}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${percent >= 80 ? "bg-green-500" : percent >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetDashboardAnalytics();
  const { data: cityStats, isLoading: isLoadingCityStats } = useGetCityStats();
  const { data: websiteStats } = useWebsiteAnalytics();

  if (isLoadingAnalytics) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-primary">Vue d'ensemble</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Biens en portefeuille</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.properties.total || 0}</div>
            <p className="text-xs text-muted-foreground">{analytics?.properties.published || 0} publiés · {analytics?.properties.reserved || 0} réservés · {analytics?.properties.sold || 0} vendus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Leads Actifs</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.leads.total || 0}</div>
            <p className="text-xs text-muted-foreground">{analytics?.leads.new || 0} nouveaux · taux {analytics?.leads.conversionRate || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.appointments.today || 0}</div>
            <p className="text-xs text-muted-foreground">{analytics?.appointments.upcoming || 0} à venir au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Estimations</CardTitle>
            <Calculator className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.estimations.pending || 0}</div>
            <p className="text-xs text-muted-foreground">{analytics?.estimations.completed || 0} traitées ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Répartition par ville</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoadingCityStats ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Chargement...</div>
              ) : cityStats && cityStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="city" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
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
            <div className="h-80 flex flex-col justify-center gap-5">
              {[
                { label: "Nouveaux leads", value: analytics?.leads.new ?? 0, color: "bg-blue-500" },
                { label: "En contact", value: analytics?.leads.contacted ?? 0, color: "bg-amber-500" },
                { label: "Convertis", value: analytics?.leads.won ?? 0, color: "bg-green-500" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="font-bold text-sm">{item.value}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all`}
                      style={{ width: `${Math.min(((item.value) / Math.max(analytics?.leads.total ?? 1, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="text-center mt-4 text-sm text-muted-foreground border-t border-border pt-4">
                Taux de conversion global : <span className="font-bold text-foreground">{analytics?.leads.conversionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Website metrics & SEO */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-xl font-bold text-primary">Performances & SEO</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top viewed properties */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Biens les plus consultés</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                {websiteStats?.totalViews ?? 0} vue{(websiteStats?.totalViews ?? 0) !== 1 ? "s" : ""} au total
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {websiteStats?.topProperties && websiteStats.topProperties.length > 0 ? (
                websiteStats.topProperties.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground">{p.city} · {STATUS_FR[p.status] ?? p.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">{p.viewCount}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune consultation enregistrée</p>
              )}
            </CardContent>
          </Card>

          {/* SEO health */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Santé SEO</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                {websiteStats?.seo.total ?? 0} annonce{(websiteStats?.seo.total ?? 0) !== 1 ? "s" : ""} analysée{(websiteStats?.seo.total ?? 0) !== 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <SeoBar label="Titres SEO renseignés" percent={websiteStats?.seo.titlePercent ?? 0} />
              <SeoBar label="Descriptions SEO renseignées" percent={websiteStats?.seo.descPercent ?? 0} />
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">Score global</div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const score = Math.round(((websiteStats?.seo.titlePercent ?? 0) + (websiteStats?.seo.descPercent ?? 0)) / 2);
                    const color = score >= 80 ? "text-green-600 bg-green-50 border-green-200" : score >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-red-600 bg-red-50 border-red-200";
                    const label = score >= 80 ? "Excellent" : score >= 50 ? "À améliorer" : "Insuffisant";
                    return (
                      <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${color}`}>
                        {score}% · {label}
                      </div>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Complétez les titres et descriptions SEO dans la fiche de chaque annonce pour améliorer votre référencement.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lead sources */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sources des leads</CardTitle>
              <p className="text-xs text-muted-foreground">D'où viennent vos prospects</p>
            </CardHeader>
            <CardContent>
              {websiteStats?.leadSources && websiteStats.leadSources.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={websiteStats.leadSources}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={35}
                      >
                        {websiteStats.leadSources.map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value: any, name: any) => [`${value} lead${value !== 1 ? "s" : ""}`, name]}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Aucun lead enregistré</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
