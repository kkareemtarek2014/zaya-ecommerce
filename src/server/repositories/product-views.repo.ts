import { desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { productViews, products } from '@/server/db/schema';

export async function incrementProductView(
  db: Db,
  productId: string,
): Promise<void> {
  const now = new Date();
  const existing = await db
    .select()
    .from(productViews)
    .where(eq(productViews.productId, productId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(productViews)
      .set({
        views: sql`${productViews.views} + 1`,
        updatedAt: now,
      })
      .where(eq(productViews.productId, productId));
    return;
  }

  await db.insert(productViews).values({
    productId,
    views: 1,
    updatedAt: now,
  });
}

export async function findMostViewed(
  db: Db,
  limit = 5,
): Promise<
  { productId: string; name: string; image: string | null; views: number }[]
> {
  const rows = await db
    .select({
      productId: productViews.productId,
      name: products.name,
      images: products.images,
      views: productViews.views,
    })
    .from(productViews)
    .innerJoin(products, eq(products.id, productViews.productId))
    .orderBy(desc(productViews.views))
    .limit(limit);

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    image: r.images?.[0] ?? null,
    views: r.views,
  }));
}
