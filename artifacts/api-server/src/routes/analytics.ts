import { Router } from "express";
import { db } from "@workspace/db";
import { propertiesTable, leadsTable, appointmentsTable, estimationsTable, activityLogsTable, usersTable } from "@workspace/db";
import { eq, gte, count, avg, desc, sql, isNotNull, ne } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

// GET /analytics/dashboard — analytics overview, staff management only
router.get("/analytics/dashboard", requireAuth, requireRole("superadmin", "admin"), async (_req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);

    const [
      [totalProps], [publishedProps], [reservedProps], [soldProps], [newThisMonth],
      [totalLeads], [newLeads], [contactedLeads], [wonLeads],
      [totalAppts], [upcomingAppts], [todayAppts],
      [totalEsts], [pendingEsts], [completedEsts],
    ] = await Promise.all([
      db.select({ count: count() }).from(propertiesTable),
      db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.status, "published")),
      db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.status, "reserved")),
      db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.status, "sold")),
      db.select({ count: count() }).from(propertiesTable).where(gte(propertiesTable.createdAt, startOfMonth)),
      db.select({ count: count() }).from(leadsTable),
      db.select({ count: count() }).from(leadsTable).where(eq(leadsTable.status, "new")),
      db.select({ count: count() }).from(leadsTable).where(eq(leadsTable.status, "contacted")),
      db.select({ count: count() }).from(leadsTable).where(eq(leadsTable.status, "won")),
      db.select({ count: count() }).from(appointmentsTable),
      db.select({ count: count() }).from(appointmentsTable).where(gte(appointmentsTable.scheduledAt, now)),
      db.select({ count: count() }).from(appointmentsTable).where(gte(appointmentsTable.scheduledAt, today)),
      db.select({ count: count() }).from(estimationsTable),
      db.select({ count: count() }).from(estimationsTable).where(eq(estimationsTable.status, "pending")),
      db.select({ count: count() }).from(estimationsTable).where(eq(estimationsTable.status, "completed")),
    ]);

    const total = totalLeads?.count ?? 0;
    const won = wonLeads?.count ?? 0;

    res.json({
      properties: {
        total: totalProps?.count ?? 0,
        published: publishedProps?.count ?? 0,
        reserved: reservedProps?.count ?? 0,
        sold: soldProps?.count ?? 0,
        newThisMonth: newThisMonth?.count ?? 0,
      },
      leads: {
        total,
        new: newLeads?.count ?? 0,
        contacted: contactedLeads?.count ?? 0,
        won,
        conversionRate: total > 0 ? Math.round((won / total) * 100) / 100 : 0,
      },
      appointments: {
        total: totalAppts?.count ?? 0,
        upcoming: upcomingAppts?.count ?? 0,
        today: todayAppts?.count ?? 0,
      },
      estimations: {
        total: totalEsts?.count ?? 0,
        pending: pendingEsts?.count ?? 0,
        completed: completedEsts?.count ?? 0,
      },
    });
  } catch (err) {
    logger.error({ err }, "Dashboard analytics error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /analytics/activity
router.get("/analytics/activity", requireAuth, async (_req, res) => {
  try {
    const activities = await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(20);
    const enriched = await Promise.all(activities.map(async (a) => {
      let actorName = null;
      let actorAvatarUrl = null;
      if (a.actorId) {
        const [actor] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(eq(usersTable.id, a.actorId));
        if (actor) { actorName = `${actor.firstName} ${actor.lastName}`; actorAvatarUrl = actor.avatarUrl ?? null; }
      }
      return { ...a, actorName, actorAvatarUrl, entityId: a.entityId ?? null, entityType: a.entityType ?? null };
    }));
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "Activity feed error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /analytics/cities
router.get("/analytics/cities", async (_req, res) => {
  try {
    const rows = await db.select({
      city: propertiesTable.city,
      count: count(),
      avgPrice: avg(propertiesTable.salePrice),
    })
      .from(propertiesTable)
      .where(eq(propertiesTable.status, "published"))
      .groupBy(propertiesTable.city)
      .orderBy(desc(count()))
      .limit(15);

    res.json(rows.map(r => ({
      city: r.city,
      count: r.count,
      avgPrice: r.avgPrice ? parseFloat(r.avgPrice) : null,
      minPrice: null,
      maxPrice: null,
    })));
  } catch (err) {
    logger.error({ err }, "City stats error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /analytics/website — performance & SEO health, staff management only
router.get("/analytics/website", requireAuth, requireRole("superadmin", "admin"), async (_req, res) => {
  try {
    const [
      topProperties,
      [totalViewsRow],
      [seoTotal],
      [seoWithTitle],
      [seoWithDesc],
      leadSources,
    ] = await Promise.all([
      db.select({ id: propertiesTable.id, title: propertiesTable.title, city: propertiesTable.city, viewCount: propertiesTable.viewCount, status: propertiesTable.status })
        .from(propertiesTable).orderBy(desc(propertiesTable.viewCount)).limit(5),
      db.select({ total: sql<number>`coalesce(sum(${propertiesTable.viewCount}),0)` }).from(propertiesTable),
      db.select({ count: count() }).from(propertiesTable),
      db.select({ count: count() }).from(propertiesTable).where(isNotNull(propertiesTable.metaTitle)),
      db.select({ count: count() }).from(propertiesTable).where(isNotNull(propertiesTable.metaDescription)),
      db.select({ source: leadsTable.source, count: count() }).from(leadsTable).groupBy(leadsTable.source).orderBy(desc(count())),
    ]);

    const seoTotalCount = seoTotal?.count ?? 0;
    const seoTitleCount = seoWithTitle?.count ?? 0;
    const seoDescCount = seoWithDesc?.count ?? 0;

    res.json({
      totalViews: Number(totalViewsRow?.total ?? 0),
      topProperties,
      seo: {
        total: seoTotalCount,
        withTitle: seoTitleCount,
        withDescription: seoDescCount,
        titlePercent: seoTotalCount > 0 ? Math.round((seoTitleCount / seoTotalCount) * 100) : 0,
        descPercent: seoTotalCount > 0 ? Math.round((seoDescCount / seoTotalCount) * 100) : 0,
      },
      leadSources: leadSources.map(s => ({
        source: s.source,
        label: { property_inquiry: "Demande bien", estimation_request: "Estimation", contact_form: "Formulaire", manual: "Manuel" }[s.source] ?? s.source,
        count: s.count,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Website analytics error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
