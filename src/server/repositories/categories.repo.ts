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

export async function insertCategory(
  db: Db,
  row: typeof categories.$inferInsert,
): Promise<CategoryRow> {
  await db.insert(categories).values(row);
  const created = await findCategoryBySlug(db, row.slug);
  if (!created) throw new Error('Failed to create category');
  return created;
}

export async function updateCategory(
  db: Db,
  slug: string,
  patch: Partial<typeof categories.$inferInsert>,
): Promise<CategoryRow> {
  await db.update(categories).set(patch).where(eq(categories.slug, slug));
  const updated = await findCategoryBySlug(db, (patch.slug as string) ?? slug);
  if (!updated) throw new Error('Category not found after update');
  return updated;
}

export async function deleteCategory(db: Db, slug: string): Promise<boolean> {
  const result = await db
    .delete(categories)
    .where(eq(categories.slug, slug))
    .returning({ slug: categories.slug });
  return result.length > 0;
}
