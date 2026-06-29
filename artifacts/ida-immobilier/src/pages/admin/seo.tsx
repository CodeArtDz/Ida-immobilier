import { useState } from "react";
import {
  useGetSeoAudit,
  useGetGoogleSeoStatus,
  useGetSearchConsoleData,
  useGetAnalyticsData,
  useGetPageSpeed,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  BarChart3,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  LinkIcon,
  ExternalLink,
  Smartphone,
  Monitor,
  KeyRound,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n: number) => nf.format(Math.round(n));
const pct = (n: number) => `${(n * 100).toFixed(1)} %`;
const pos = (n: number) => n.toFixed(1);

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Guided setup (shown when a Google service is not connected) ──────────────
function GuidedSetup({ service }: { service: "searchConsole" | "analytics" }) {
  const secret =
    service === "searchConsole"
      ? "GSC_SITE_URL"
      : "GA4_PROPERTY_ID";
  const label = service === "searchConsole" ? "Google Search Console" : "Google Analytics (GA4)";
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <CardTitle>Connecter {label}</CardTitle>
        </div>
        <CardDescription>
          Aucun connecteur Replit n'existe pour {label}. La connexion se fait via un compte de
          service Google. Une fois configurée, ce panneau affichera automatiquement vos données.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Créez un projet Google Cloud et un <strong>compte de service</strong> (clé JSON).</li>
          <li>
            Activez l'API{" "}
            {service === "searchConsole" ? "Google Search Console" : "Google Analytics Data"}.
          </li>
          <li>
            Accordez l'accès (lecture) à l'adresse e-mail du compte de service dans{" "}
            {service === "searchConsole"
              ? "Search Console (Utilisateurs et autorisations)"
              : "GA4 (Administration → Accès à la propriété)"}
            .
          </li>
          <li>
            Ajoutez les secrets suivants au projet :
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="rounded bg-muted px-2 py-1">GOOGLE_SERVICE_ACCOUNT_JSON</div>
              <div className="rounded bg-muted px-2 py-1">{secret}</div>
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}

function RangeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 derniers jours</SelectItem>
        <SelectItem value="28">28 derniers jours</SelectItem>
        <SelectItem value="90">90 derniers jours</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── SEO Audit tab ───────────────────────────────────────────────────────────
function AuditTab() {
  const { data, isLoading, isError } = useGetSeoAudit();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !data) return <p className="text-muted-foreground">Impossible de charger l'audit SEO.</p>;

  const issueGroups = [
    { title: "Titres SEO manquants", items: data.missingTitle },
    { title: "Descriptions SEO manquantes", items: data.missingDescription },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${scoreColor(data.summary.score)}`}>
              {data.summary.score}
              <span className="text-lg">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.summary.totalIssues} problème(s) détecté(s)</p>
          </CardContent>
        </Card>
        <StatCard label="Pages connues" value={fmt(data.pages.known)} sub={`${data.pages.properties} biens · ${data.pages.cities} villes`} />
        <StatCard label="Articles" value={fmt(data.pages.articles)} sub={`${data.pages.agents} agents · ${data.pages.staticPages} pages fixes`} />
        <StatCard label="URLs sitemap" value={fmt(data.sitemap.totalUrls)} sub={data.sitemap.ok ? "Sitemap actif" : "Sitemap vide"} />
      </div>

      {/* Issue lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {issueGroups.map((g) => (
          <Card key={g.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {g.items.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <CardTitle className="text-base">{g.title}</CardTitle>
                <Badge variant={g.items.length === 0 ? "secondary" : "destructive"}>{g.items.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {g.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun problème. 🎉</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                  {g.items.slice(0, 50).map((it) => (
                    <li key={`${it.type}-${it.id}`} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1">
                      <span className="truncate">{it.label}</span>
                      <Badge variant="outline" className="shrink-0 capitalize">{it.type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base">Titres dupliqués</CardTitle>
              <Badge variant={data.duplicateTitles.length === 0 ? "secondary" : "destructive"}>{data.duplicateTitles.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.duplicateTitles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun doublon de titre.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {data.duplicateTitles.map((d) => (
                  <li key={d.value} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1">
                    <span className="truncate">{d.value}</span>
                    <Badge variant="outline" className="shrink-0">×{d.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-red-600" />
              <CardTitle className="text-base">Liens internes / maillage</CardTitle>
              <Badge variant={data.brokenLinks.length === 0 ? "secondary" : "destructive"}>{data.brokenLinks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.brokenLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun problème structurel détecté.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {data.brokenLinks.slice(0, 50).map((it) => (
                  <li key={`${it.type}-${it.id}-${it.detail}`} className="border-b border-border/50 pb-1">
                    <span className="font-medium">{it.label}</span>
                    {it.detail && <p className="text-xs text-muted-foreground">{it.detail}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sitemap breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composition du sitemap</CardTitle>
          <CardDescription>
            <a href={data.sitemap.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
              {data.sitemap.url} <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">URLs</TableHead>
                <TableHead className="text-right">État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sitemap.children.map((c) => (
                <TableRow key={c.name}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-right">{fmt(c.urlCount)}</TableCell>
                  <TableCell className="text-right">
                    {c.ok ? (
                      <Badge variant="secondary">OK</Badge>
                    ) : (
                      <Badge variant="outline">Vide</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Search Console tab ──────────────────────────────────────────────────────
function SearchConsoleTab({ connected, days }: { connected: boolean; days: number }) {
  const { data, isLoading } = useGetSearchConsoleData({ days });

  if (!connected) return <GuidedSetup service="searchConsole" />;
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return <p className="text-muted-foreground">Aucune donnée.</p>;
  if (data.error)
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Erreur Search Console</CardTitle>
          <CardDescription>{data.error}</CardDescription>
        </CardHeader>
      </Card>
    );
  if (!data.connected) return <GuidedSetup service="searchConsole" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Clics" value={fmt(data.totals.clicks)} />
        <StatCard label="Impressions" value={fmt(data.totals.impressions)} />
        <StatCard label="CTR" value={pct(data.totals.ctr)} />
        <StatCard label="Position moy." value={pos(data.totals.position)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution des performances</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.byDate}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clics" stroke="hsl(var(--primary))" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="impressions" name="Impressions" stroke="hsl(var(--accent))" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Requêtes principales</CardTitle></CardHeader>
          <CardContent>
            <QueryTable rows={data.topQueries} keyLabel="Requête" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pages principales</CardTitle></CardHeader>
          <CardContent>
            <QueryTable rows={data.topPages} keyLabel="Page" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QueryTable({ rows, keyLabel }: { rows: Array<{ key: string; clicks: number; impressions: number; ctr: number; position: number }>; keyLabel: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{keyLabel}</TableHead>
          <TableHead className="text-right">Clics</TableHead>
          <TableHead className="text-right">Impr.</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">Pos.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 15).map((r) => (
          <TableRow key={r.key}>
            <TableCell className="max-w-[220px] truncate">{r.key}</TableCell>
            <TableCell className="text-right">{fmt(r.clicks)}</TableCell>
            <TableCell className="text-right">{fmt(r.impressions)}</TableCell>
            <TableCell className="text-right">{pct(r.ctr)}</TableCell>
            <TableCell className="text-right">{pos(r.position)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Analytics tab ───────────────────────────────────────────────────────────
function AnalyticsTab({ connected, days }: { connected: boolean; days: number }) {
  const { data, isLoading } = useGetAnalyticsData({ days });

  if (!connected) return <GuidedSetup service="analytics" />;
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return <p className="text-muted-foreground">Aucune donnée.</p>;
  if (data.error)
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Erreur Analytics</CardTitle>
          <CardDescription>{data.error}</CardDescription>
        </CardHeader>
      </Card>
    );
  if (!data.connected) return <GuidedSetup service="analytics" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Utilisateurs" value={fmt(data.totals.users)} />
        <StatCard label="Sessions" value={fmt(data.totals.sessions)} />
        <StatCard label="Pages vues" value={fmt(data.totals.pageViews)} />
        <StatCard label="Engagement moy." value={`${data.totals.avgEngagementTime}s`} sub={`Taux ${pct(data.totals.engagementRate)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trafic du site</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.byDate}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" name="Utilisateurs" stroke="hsl(var(--primary))" fill="url(#usersGrad)" />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(var(--accent))" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Pages les plus vues</CardTitle></CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Page</TableHead><TableHead className="text-right">Vues</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.topPages.slice(0, 15).map((p) => (
                    <TableRow key={p.path}>
                      <TableCell className="max-w-[260px] truncate">{p.path}</TableCell>
                      <TableCell className="text-right">{fmt(p.views)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Villes des visiteurs</CardTitle></CardHeader>
          <CardContent>
            {data.topCities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Ville</TableHead><TableHead className="text-right">Utilisateurs</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.topCities.slice(0, 15).map((c) => (
                    <TableRow key={c.city}>
                      <TableCell>{c.city}</TableCell>
                      <TableCell className="text-right">{fmt(c.users)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Core Web Vitals tab ─────────────────────────────────────────────────────
const PS_TEMPLATES = [
  { key: "home" as const, label: "Accueil" },
  { key: "search" as const, label: "Recherche" },
  { key: "property" as const, label: "Annonce" },
  { key: "city" as const, label: "Ville" },
  { key: "blog" as const, label: "Blog" },
];

function CoreWebVitalsTab() {
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mesures via PageSpeed Insights / CrUX. Nécessite un site publié et accessible publiquement.
        </p>
        <Select value={strategy} onValueChange={(v) => setStrategy(v as "mobile" | "desktop")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mobile">
              <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Mobile</span>
            </SelectItem>
            <SelectItem value="desktop">
              <span className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Ordinateur</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PS_TEMPLATES.map((t) => (
          <PageSpeedCard key={t.key} template={t.key} label={t.label} strategy={strategy} />
        ))}
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${value == null ? "text-muted-foreground" : scoreColor(value)}`}>
        {value == null ? "—" : value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function vital(value: number | null | undefined, unit: "ms" | "s" | "score") {
  if (value == null) return "—";
  if (unit === "ms") return `${Math.round(value)} ms`;
  if (unit === "s") return `${(value / 1000).toFixed(2)} s`;
  return value.toFixed(2);
}

function PageSpeedCard({ template, label, strategy }: { template: "home" | "search" | "property" | "city" | "blog"; label: string; strategy: "mobile" | "desktop" }) {
  const { data, isLoading, isFetching } = useGetPageSpeed({ template, strategy });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {data?.source && <Badge variant="outline">{data.source === "field" ? "Données terrain" : "Laboratoire"}</Badge>}
        </div>
        {data?.url && <CardDescription className="truncate">{data.url}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading || isFetching ? (
          <Skeleton className="h-28 w-full" />
        ) : !data || !data.available ? (
          <p className="text-sm text-muted-foreground">{data?.error ?? "Mesure indisponible."}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <ScorePill label="Perf" value={data.scores.performance} />
              <ScorePill label="SEO" value={data.scores.seo} />
              <ScorePill label="Access." value={data.scores.accessibility} />
              <ScorePill label="Bonnes pr." value={data.scores.bestPractices} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-border pt-3">
              <div><div className="font-semibold">{vital(data.coreWebVitals.lcp, "ms")}</div><div className="text-muted-foreground">LCP</div></div>
              <div><div className="font-semibold">{vital(data.coreWebVitals.cls, "score")}</div><div className="text-muted-foreground">CLS</div></div>
              <div><div className="font-semibold">{vital(data.coreWebVitals.inp, "ms")}</div><div className="text-muted-foreground">INP</div></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminSeo() {
  const [days, setDays] = useState("28");
  const { data: status } = useGetGoogleSeoStatus();
  const scConnected = status?.searchConsole.connected ?? false;
  const gaConnected = status?.analytics.connected ?? false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">SEO &amp; Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Audit SEO interne et données Google (Search Console, Analytics, Core Web Vitals).
        </p>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="audit"><ShieldCheck className="w-4 h-4 mr-2" /> Santé SEO</TabsTrigger>
            <TabsTrigger value="search-console">
              <Search className="w-4 h-4 mr-2" /> Search Console
              {!scConnected && <span className="ml-2 w-2 h-2 rounded-full bg-amber-500" />}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
              {!gaConnected && <span className="ml-2 w-2 h-2 rounded-full bg-amber-500" />}
            </TabsTrigger>
            <TabsTrigger value="cwv"><Gauge className="w-4 h-4 mr-2" /> Core Web Vitals</TabsTrigger>
          </TabsList>
          <RangeSelect value={days} onChange={setDays} />
        </div>

        <TabsContent value="audit"><AuditTab /></TabsContent>
        <TabsContent value="search-console"><SearchConsoleTab connected={scConnected} days={parseInt(days, 10)} /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab connected={gaConnected} days={parseInt(days, 10)} /></TabsContent>
        <TabsContent value="cwv"><CoreWebVitalsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
