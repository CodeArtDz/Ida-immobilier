// Idempotent backfill for the SEO engine: inserts the city registry and
// generates slugs for any property missing one. Safe to run repeatedly and on
// an already-seeded database (unlike the full seed, which early-returns).
import { db, citiesTable, propertiesTable } from "@workspace/db";
import { buildPropertySlug } from "@workspace/seo";
import { eq, isNull } from "drizzle-orm";
import { CITIES_SEED } from "./cities-data";

async function run() {
  await db.insert(citiesTable).values(CITIES_SEED).onConflictDoNothing();
  console.log(`Cities upserted (${CITIES_SEED.length} in registry)`);

  const missing = await db.select().from(propertiesTable).where(isNull(propertiesTable.slug));
  for (const prop of missing) {
    const slug = buildPropertySlug({
      id: prop.id,
      type: prop.type,
      city: prop.city,
      rooms: prop.rooms,
      livingArea: prop.livingArea,
    });
    await db.update(propertiesTable).set({ slug }).where(eq(propertiesTable.id, prop.id));
  }
  console.log(`Property slugs backfilled (${missing.length} updated)`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("SEO backfill failed:", err);
    process.exit(1);
  });
