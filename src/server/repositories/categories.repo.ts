import { asc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { categories } from '@/server/db/schema';

export type CategoryRow = typeof categories.$inferSelect;

export async function findAllCategories(db: Db): Promise<CategoryRow[]> {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function findCategoryBySlug(
  db: Db,
  slug: string,
): Promise<CategoryRow | null> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}
