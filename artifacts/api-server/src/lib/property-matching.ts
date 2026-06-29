// Server-side property-match alerts.
//
// When a property is published or changes price/status, match it against every
// client's saved searches and favorites, then create in-dashboard notifications
// and best-effort emails. All work here is non-blocking: callers fire these
// functions without awaiting the result on the request path, and every failure
// is swallowed and logged so it can never break a publish/update flow.
import { db } from "@workspace/db";
import {
  savedSearchesTable,
  favoritesTable,
  notificationsTable,
  usersTable,
  type SavedSearch,
  type Property,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "./logger";
import { sendPropertyAlertEmail } from "./mailer";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  published: "Disponible",
  reserved: "Sous compromis",
  sold: "Vendu",
  rented: "Loué",
  archived: "Archivé",
};

// The price a saved search / favorite alert should display and compare against:
// sale price for sales, otherwise rental price.
function propertyPrice(property: Property): number | null {
  if (property.salePrice != null) return parseFloat(property.salePrice);
  if (property.rentalPrice != null) return parseFloat(property.rentalPrice);
  return null;
}

// Does a saved search match a property? Only the columns that exist on
// saved_searches are considered (type, city, price range, living-area range,
// minimum rooms, minimum bedrooms). A missing search field is "no preference".
// A required field the property lacks (e.g. price filter but no price) fails the
// match rather than spamming the client.
function searchMatchesProperty(search: SavedSearch, property: Property): boolean {
  if (search.type && search.type !== property.type) return false;

  if (search.city && search.city.trim().toLowerCase() !== property.city.trim().toLowerCase()) return false;

  const price = propertyPrice(property);
  const minPrice = search.minPrice != null ? parseFloat(search.minPrice) : null;
  const maxPrice = search.maxPrice != null ? parseFloat(search.maxPrice) : null;
  if (minPrice != null || maxPrice != null) {
    if (price == null) return false;
    if (minPrice != null && price < minPrice) return false;
    if (maxPrice != null && price > maxPrice) return false;
  }

  if (search.minArea != null || search.maxArea != null) {
    const area = property.livingArea;
    if (area == null) return false;
    if (search.minArea != null && area < search.minArea) return false;
    if (search.maxArea != null && area > search.maxArea) return false;
  }

  if (search.rooms != null) {
    if (property.rooms == null || property.rooms < search.rooms) return false;
  }

  if (search.bedrooms != null) {
    if (property.bedrooms == null || property.bedrooms < search.bedrooms) return false;
  }

  return true;
}

type UserContact = { id: number; email: string; firstName: string; lastName: string; isActive: boolean };

// Batch-fetch users once per fan-out (avoids a per-recipient query).
async function getUsers(userIds: number[]): Promise<Map<number, UserContact>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({ id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName, isActive: usersTable.isActive })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));
  return new Map(rows.map((r) => [r.id, r]));
}

// Newly-published (or back-on-market) property → notify owners of matching saved
// searches. One notification per client even if several of their searches match;
// email is sent only when at least one matching search has alerts enabled.
export async function notifySavedSearchMatches(property: Property, kind: "new_match" | "back_on_market" = "new_match"): Promise<void> {
  try {
    const searches = await db.select().from(savedSearchesTable);
    const matched = searches.filter((s) => searchMatchesProperty(s, property));
    if (matched.length === 0) return;

    // Collapse to one entry per user; email enabled if any matching search opts in.
    const byUser = new Map<number, { alertEnabled: boolean; searchName: string | null }>();
    for (const s of matched) {
      const existing = byUser.get(s.userId);
      if (!existing) {
        byUser.set(s.userId, { alertEnabled: s.alertEnabled, searchName: s.name });
      } else if (s.alertEnabled && !existing.alertEnabled) {
        existing.alertEnabled = true;
        existing.searchName = s.name;
      }
    }

    const price = propertyPrice(property);
    const matchedUserIds = [...byUser.keys()];

    // Dedupe only the first-publish ("new_match") alert so an accidental
    // double-publish can't spam clients. A "back_on_market" transition is a
    // genuinely new event for the same property, so it is always re-sent.
    const alreadyNotified = new Set<number>();
    if (kind === "new_match") {
      const existing = await db
        .select({ userId: notificationsTable.userId })
        .from(notificationsTable)
        .where(and(
          eq(notificationsTable.type, "new_property_match"),
          eq(notificationsTable.propertyId, property.id),
          inArray(notificationsTable.userId, matchedUserIds),
        ));
      for (const e of existing) alreadyNotified.add(e.userId);
    }

    const users = await getUsers(matchedUserIds);
    let notified = 0;

    for (const [userId, info] of byUser) {
      try {
        if (alreadyNotified.has(userId)) continue;

        await db.insert(notificationsTable).values({
          userId,
          type: "new_property_match",
          title: kind === "back_on_market" ? "Un bien suivi est de nouveau disponible" : "Nouveau bien correspondant à votre recherche",
          body: `${property.title} — ${property.city}`,
          propertyId: property.id,
        });
        notified++;

        if (info.alertEnabled) {
          const user = users.get(userId);
          if (user && user.isActive) {
            await sendPropertyAlertEmail({
              to: user.email,
              clientName: `${user.firstName} ${user.lastName}`,
              kind,
              propertyTitle: property.title,
              propertyId: property.id,
              propertyCity: property.city,
              price,
              statusLabel: STATUS_LABEL[property.status] ?? null,
              savedSearchName: info.searchName,
            });
          }
        }
      } catch (err) {
        logger.error({ err, userId, propertyId: property.id }, "Saved-search match notification failed for user");
      }
    }

    logger.info({ propertyId: property.id, matchedUsers: byUser.size, notified }, "Saved-search match notifications processed");
  } catch (err) {
    logger.error({ err, propertyId: property.id }, "notifySavedSearchMatches failed");
  }
}

// Price drop and/or status change on a property → notify both the clients who
// favorited it AND the owners of saved searches that still match it. Recipients
// are unioned so a client who both favorited the property and has a matching
// saved search receives only one notification per kind of change. A separate
// "new_property_match" alert (notifySavedSearchMatches) covers transitions INTO
// published, so the back-on-market status alert here only targets favoriters to
// avoid duplicating that event for saved-search owners.
export async function notifyPriceStatusChanges(before: Property, after: Property): Promise<void> {
  try {
    const beforePrice = propertyPrice(before);
    const afterPrice = propertyPrice(after);
    const priceDropped = beforePrice != null && afterPrice != null && afterPrice < beforePrice;
    const becamePublished = after.status === "published" && before.status !== "published";
    const statusChanged = before.status !== after.status;

    if (!priceDropped && !statusChanged) return;

    // Favoriters of this property.
    const favRows = await db
      .select({ userId: favoritesTable.userId })
      .from(favoritesTable)
      .where(eq(favoritesTable.propertyId, after.id));
    const favSet = new Set(favRows.map((f) => f.userId));

    // Owners of saved searches that still match the property after the change.
    // Only relevant for events saved-search owners should hear about: a price
    // drop, or a status change that is NOT a transition into published (that is
    // covered by the new_property_match alert instead).
    const matchByUser = new Map<number, { alertEnabled: boolean; searchName: string | null }>();
    if (priceDropped || (statusChanged && !becamePublished)) {
      const searches = await db.select().from(savedSearchesTable);
      for (const s of searches) {
        if (!searchMatchesProperty(s, after)) continue;
        const ex = matchByUser.get(s.userId);
        if (!ex) matchByUser.set(s.userId, { alertEnabled: s.alertEnabled, searchName: s.name });
        else if (s.alertEnabled && !ex.alertEnabled) {
          ex.alertEnabled = true;
          ex.searchName = s.name;
        }
      }
    }

    // Recipient sets per kind of change.
    const priceRecipients = priceDropped ? new Set<number>([...favSet, ...matchByUser.keys()]) : new Set<number>();
    const statusRecipients = statusChanged
      ? (becamePublished ? new Set<number>(favSet) : new Set<number>([...favSet, ...matchByUser.keys()]))
      : new Set<number>();

    const allIds = new Set<number>([...priceRecipients, ...statusRecipients]);
    if (allIds.size === 0) return;

    const statusLabel = STATUS_LABEL[after.status] ?? after.status;
    const users = await getUsers([...allIds]);
    let notified = 0;

    for (const userId of allIds) {
      try {
        const user = users.get(userId);
        const searchInfo = matchByUser.get(userId);
        // Favoriters are always emailed (no per-favorite toggle); saved-search
        // matchers are emailed only when their search has alerts enabled.
        const emailAllowed = favSet.has(userId) || Boolean(searchInfo?.alertEnabled);

        if (priceRecipients.has(userId)) {
          await db.insert(notificationsTable).values({
            userId,
            type: "price_change",
            title: "Baisse de prix sur un bien",
            body: `${after.title} — ${after.city}`,
            propertyId: after.id,
          });
          notified++;
          if (emailAllowed && user && user.isActive) {
            await sendPropertyAlertEmail({
              to: user.email,
              clientName: `${user.firstName} ${user.lastName}`,
              kind: "price_drop",
              propertyTitle: after.title,
              propertyId: after.id,
              propertyCity: after.city,
              price: afterPrice,
              oldPrice: beforePrice,
              statusLabel,
              savedSearchName: searchInfo?.searchName ?? null,
            });
          }
        }

        if (statusRecipients.has(userId)) {
          const backOnMarket = after.status === "published" && before.status !== "published" && before.status !== "draft";
          await db.insert(notificationsTable).values({
            userId,
            type: "status_change",
            title: backOnMarket ? "Un bien est de nouveau disponible" : "Statut mis à jour sur un bien",
            body: `${after.title} — ${statusLabel}`,
            propertyId: after.id,
          });
          notified++;
          if (emailAllowed && user && user.isActive) {
            await sendPropertyAlertEmail({
              to: user.email,
              clientName: `${user.firstName} ${user.lastName}`,
              kind: backOnMarket ? "back_on_market" : "status_change",
              propertyTitle: after.title,
              propertyId: after.id,
              propertyCity: after.city,
              price: afterPrice,
              statusLabel,
              savedSearchName: searchInfo?.searchName ?? null,
            });
          }
        }
      } catch (err) {
        logger.error({ err, userId, propertyId: after.id }, "Price/status notification failed for user");
      }
    }

    logger.info({ propertyId: after.id, recipients: allIds.size, notified, priceDropped, statusChanged }, "Price/status change notifications processed");
  } catch (err) {
    logger.error({ err, propertyId: after.id }, "notifyPriceStatusChanges failed");
  }
}
