import { JWT } from "google-auth-library";
import { logger } from "./logger";

// ─── Google SEO data access ──────────────────────────────────────────────────
// No Replit connector exists for Google Search Console / Analytics, so this
// module authenticates server-side with a Google Cloud *service account*.
// Configure via secrets (never hard-coded):
//   GOOGLE_SERVICE_ACCOUNT_JSON  — the full service-account key JSON (string)
//   GSC_SITE_URL                 — verified Search Console property
//                                  (e.g. "https://ida-immobilier.com/" or
//                                   "sc-domain:ida-immobilier.com")
//   GA4_PROPERTY_ID              — numeric GA4 property id (e.g. "123456789")
//   PAGESPEED_API_KEY            — optional, raises PageSpeed quota
// The service-account email must be granted access in Search Console and GA4.

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (parsed.client_email && parsed.private_key) {
      return { client_email: parsed.client_email, private_key: parsed.private_key };
    }
  } catch {
    // Allow base64-encoded JSON as a fallback.
    try {
      const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Partial<ServiceAccount>;
      if (decoded.client_email && decoded.private_key) {
        return { client_email: decoded.client_email, private_key: decoded.private_key };
      }
    } catch {
      /* fall through */
    }
  }
  logger.warn("GOOGLE_SERVICE_ACCOUNT_JSON is set but could not be parsed");
  return null;
}

export function gscSiteUrl(): string | null {
  return process.env.GSC_SITE_URL?.trim() || null;
}

export function ga4PropertyId(): string | null {
  return process.env.GA4_PROPERTY_ID?.trim() || null;
}

export function pageSpeedApiKey(): string | null {
  return process.env.PAGESPEED_API_KEY?.trim() || null;
}

export function searchConsoleConnected(): boolean {
  return getServiceAccount() != null && gscSiteUrl() != null;
}

export function analyticsConnected(): boolean {
  return getServiceAccount() != null && ga4PropertyId() != null;
}

async function getAccessToken(scopes: string[]): Promise<string | null> {
  const sa = getServiceAccount();
  if (!sa) return null;
  const client = new JWT({ email: sa.client_email, key: sa.private_key, scopes });
  const { access_token } = await client.authorize();
  return access_token ?? null;
}

// ─── Search Console ──────────────────────────────────────────────────────────

export interface ScRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
export interface ScDatePoint extends Omit<ScRow, "key"> {
  date: string;
}
export interface SearchConsoleData {
  connected: boolean;
  error: string | null;
  range: { startDate: string | null; endDate: string | null };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  byDate: ScDatePoint[];
  topPages: ScRow[];
  topQueries: ScRow[];
}

function emptySearchConsole(connected: boolean, error: string | null = null): SearchConsoleData {
  return {
    connected,
    error,
    range: { startDate: null, endDate: null },
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    byDate: [],
    topPages: [],
    topQueries: [],
  };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0]!;
}

async function gscQuery(
  token: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }>> {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Search Console API ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows?: Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
  return json.rows ?? [];
}

export async function fetchSearchConsole(days: number): Promise<SearchConsoleData> {
  if (!searchConsoleConnected()) return emptySearchConsole(false);
  const siteUrl = gscSiteUrl()!;
  const startDate = isoDaysAgo(days);
  const endDate = isoDaysAgo(1);
  try {
    const token = await getAccessToken(["https://www.googleapis.com/auth/webmasters.readonly"]);
    if (!token) return emptySearchConsole(false, "Authentification Google échouée");

    const base = { startDate, endDate };
    const [totalsRows, dateRows, pageRows, queryRows] = await Promise.all([
      gscQuery(token, siteUrl, { ...base, rowLimit: 1 }),
      gscQuery(token, siteUrl, { ...base, dimensions: ["date"], rowLimit: 1000 }),
      gscQuery(token, siteUrl, { ...base, dimensions: ["page"], rowLimit: 20 }),
      gscQuery(token, siteUrl, { ...base, dimensions: ["query"], rowLimit: 20 }),
    ]);

    const t = totalsRows[0];
    return {
      connected: true,
      error: null,
      range: { startDate, endDate },
      totals: {
        clicks: t?.clicks ?? 0,
        impressions: t?.impressions ?? 0,
        ctr: t?.ctr ?? 0,
        position: t?.position ?? 0,
      },
      byDate: dateRows.map((r) => ({
        date: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topPages: pageRows.map((r) => ({
        key: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topQueries: queryRows.map((r) => ({
        key: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
    };
  } catch (err) {
    logger.error({ err }, "Search Console fetch failed");
    return emptySearchConsole(true, err instanceof Error ? err.message : "Erreur Search Console");
  }
}

// ─── Analytics (GA4 Data API) ────────────────────────────────────────────────

export interface GaDatePoint {
  date: string;
  users: number;
  sessions: number;
}
export interface AnalyticsData {
  connected: boolean;
  error: string | null;
  range: { startDate: string | null; endDate: string | null };
  totals: { users: number; sessions: number; pageViews: number; engagementRate: number; avgEngagementTime: number };
  byDate: GaDatePoint[];
  topPages: Array<{ path: string; views: number }>;
  topCities: Array<{ city: string; users: number }>;
}

function emptyAnalytics(connected: boolean, error: string | null = null): AnalyticsData {
  return {
    connected,
    error,
    range: { startDate: null, endDate: null },
    totals: { users: 0, sessions: 0, pageViews: 0, engagementRate: 0, avgEngagementTime: 0 },
    byDate: [],
    topPages: [],
    topCities: [],
  };
}

interface GaReportRow {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

async function ga4RunReport(
  token: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<GaReportRow[]> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GA4 API ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows?: GaReportRow[] };
  return json.rows ?? [];
}

export async function fetchAnalytics(days: number): Promise<AnalyticsData> {
  if (!analyticsConnected()) return emptyAnalytics(false);
  const propertyId = ga4PropertyId()!;
  const startDate = isoDaysAgo(days);
  const endDate = "today";
  try {
    const token = await getAccessToken(["https://www.googleapis.com/auth/analytics.readonly"]);
    if (!token) return emptyAnalytics(false, "Authentification Google échouée");

    const dateRanges = [{ startDate, endDate }];
    const [totalsRows, dateRows, pageRows, cityRows] = await Promise.all([
      ga4RunReport(token, propertyId, {
        dateRanges,
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "userEngagementDuration" },
        ],
      }),
      ga4RunReport(token, propertyId, {
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      ga4RunReport(token, propertyId, {
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 20,
      }),
      ga4RunReport(token, propertyId, {
        dateRanges,
        dimensions: [{ name: "city" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: 15,
      }),
    ]);

    const tm = totalsRows[0]?.metricValues ?? [];
    const num = (i: number) => Number(tm[i]?.value ?? 0);
    const totalUsers = num(0);
    const totalEngagementSeconds = num(4);

    return {
      connected: true,
      error: null,
      range: { startDate, endDate },
      totals: {
        users: Math.round(totalUsers),
        sessions: Math.round(num(1)),
        pageViews: Math.round(num(2)),
        engagementRate: Math.round(num(3) * 1000) / 1000,
        avgEngagementTime: totalUsers > 0 ? Math.round(totalEngagementSeconds / totalUsers) : 0,
      },
      byDate: dateRows.map((r) => {
        const raw = r.dimensionValues?.[0]?.value ?? "";
        const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
        return {
          date,
          users: Math.round(Number(r.metricValues?.[0]?.value ?? 0)),
          sessions: Math.round(Number(r.metricValues?.[1]?.value ?? 0)),
        };
      }),
      topPages: pageRows.map((r) => ({
        path: r.dimensionValues?.[0]?.value ?? "",
        views: Math.round(Number(r.metricValues?.[0]?.value ?? 0)),
      })),
      topCities: cityRows
        .map((r) => ({
          city: r.dimensionValues?.[0]?.value ?? "",
          users: Math.round(Number(r.metricValues?.[0]?.value ?? 0)),
        }))
        .filter((c) => c.city && c.city !== "(not set)"),
    };
  } catch (err) {
    logger.error({ err }, "Analytics fetch failed");
    return emptyAnalytics(true, err instanceof Error ? err.message : "Erreur Analytics");
  }
}

// ─── PageSpeed Insights / CrUX ───────────────────────────────────────────────

export interface PageSpeedResult {
  available: boolean;
  template: string;
  strategy: string;
  url: string | null;
  error: string | null;
  source: string | null;
  scores: {
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
  };
  coreWebVitals: {
    lcp: number | null;
    cls: number | null;
    inp: number | null;
    fcp: number | null;
    ttfb: number | null;
  };
}

export async function fetchPageSpeed(
  template: string,
  url: string,
  strategy: "mobile" | "desktop",
): Promise<PageSpeedResult> {
  const result: PageSpeedResult = {
    available: false,
    template,
    strategy,
    url,
    error: null,
    source: null,
    scores: { performance: null, seo: null, accessibility: null, bestPractices: null },
    coreWebVitals: { lcp: null, cls: null, inp: null, fcp: null, ttfb: null },
  };
  try {
    const key = pageSpeedApiKey();
    const params = new URLSearchParams();
    params.set("url", url);
    params.set("strategy", strategy);
    for (const c of ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"]) params.append("category", c);
    if (key) params.set("key", key);

    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      result.error = `PageSpeed API ${res.status}: ${text.slice(0, 200)}`;
      return result;
    }
    const json = (await res.json()) as {
      lighthouseResult?: { categories?: Record<string, { score?: number }>; audits?: Record<string, { numericValue?: number }> };
      loadingExperience?: { metrics?: Record<string, { percentile?: number }> };
    };

    const cats = json.lighthouseResult?.categories ?? {};
    const pct = (s?: number) => (s == null ? null : Math.round(s * 100));
    result.scores = {
      performance: pct(cats.performance?.score),
      seo: pct(cats.seo?.score),
      accessibility: pct(cats.accessibility?.score),
      bestPractices: pct(cats["best-practices"]?.score),
    };

    const field = json.loadingExperience?.metrics;
    if (field && Object.keys(field).length > 0) {
      result.source = "field";
      result.coreWebVitals = {
        lcp: field.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
        cls: field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null
          ? field.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
          : null,
        inp: field.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
        fcp: field.FIRST_CONTENTFUL_PAINT_MS?.percentile ?? null,
        ttfb: field.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile ?? null,
      };
    } else {
      const audits = json.lighthouseResult?.audits ?? {};
      result.source = "lab";
      result.coreWebVitals = {
        lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
        cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
        inp: audits["interaction-to-next-paint"]?.numericValue ?? null,
        fcp: audits["first-contentful-paint"]?.numericValue ?? null,
        ttfb: audits["server-response-time"]?.numericValue ?? null,
      };
    }

    result.available = true;
    return result;
  } catch (err) {
    logger.error({ err }, "PageSpeed fetch failed");
    result.error = err instanceof Error ? err.message : "Erreur PageSpeed";
    return result;
  }
}
