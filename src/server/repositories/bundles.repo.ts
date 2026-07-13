import 'server-only';
import { eq, asc } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { bundles, bundleItems } from '@/server/db/schema';

export type BundleRow = typeof bundles.$inferSelect;
export type BundleItemRow = typeof bundleItems.$inferSelect;

export async function listBundles(
  db: Db,
): Promise<Array<{ bundle: BundleRow; items: BundleItemRow[] }>> {
  const rows = await db.select().from(bundles).orderBy(asc(bundles.createdAt));
  const result: Array<{ bundle: BundleRow; items: BundleItemRow[] }> = [];
  for (const bundle of rows) {
    const items = await db
      .select()
      .from(bundleItems)
      .where(eq(bundleItems.bundleId, bundle.id));
    result.push({ bundle, items });
  }
  return result;
}

export async function findBundleById(
  db: Db,
  id: string,
): Promise<{ bundle: BundleRow; items: BundleItemRow[] } | null> {
  const rows = await db.select().from(bundles).where(eq(bundles.id, id)).limit(1);
  const bundle = rows[0];
  if (!bundle) return null;
  const items = await db
    .select()
    .from(bundleItems)
    .where(eq(bundleItems.bundleId, id));
  return { bundle, items };
}

export async function insertBundle(
  db: Db,
  row: BundleRow,
  items: BundleItemRow[],
): Promise<{ bundle: BundleRow; items: BundleItemRow[] }> {
  await db.insert(bundles).values(row);
  if (items.length) {
    await db.insert(bundleItems).values(items);
  }
  return { bundle: row, items };
}

export async function replaceBundle(
  db: Db,
  id: string,
  patch: Partial<Omit<BundleRow, 'id' | 'createdAt'>>,
  items: BundleItemRow[] | null,
): Promise<{ bundle: BundleRow; items: BundleItemRow[] } | null> {
  await db.update(bundles).set(patch).where(eq(bundles.id, id));
  if (items) {
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
    if (items.length) await db.insert(bundleItems).values(items);
  }
  return findBundleById(db, id);
}

export async function deleteBundle(db: Db, id: string): Promise<boolean> {
  const existing = await findBundleById(db, id);
  if (!existing) return false;
  await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
  await db.delete(bundles).where(eq(bundles.id, id));
  return true;
}

export async function listActiveBundles(
  db: Db,
  now = new Date(),
): Promise<Array<{ bundle: BundleRow; items: BundleItemRow[] }>> {
  const all = await listBundles(db);
  return all.filter(({ bundle }) => {
    if (!bundle.active) return false;
    if (bundle.startsAt && bundle.startsAt.getTime() > now.getTime()) return false;
    if (bundle.endsAt && bundle.endsAt.getTime() < now.getTime()) return false;
    return true;
  });
}

export async function findProductBundles(db: Db, productId: string) {
  const links = await db
    .select()
    .from(bundleItems)
    .where(eq(bundleItems.productId, productId));
  const result: Array<{ bundle: BundleRow; items: BundleItemRow[] }> = [];
  for (const link of links) {
    const found = await findBundleById(db, link.bundleId);
    if (found && found.bundle.active) result.push(found);
  }
  return result;
}
