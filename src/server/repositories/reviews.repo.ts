import { avg, count, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { products, reviews } from '@/server/db/schema';

export type ReviewRow = typeof reviews.$inferSelect;

export async function listReviewsByProduct(
  db: Db,
  productId: string,
): Promise<ReviewRow[]> {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(
  db: Db,
  input: {
    id: string;
    productId: string;
    userId: string;
    authorName: string;
    rating: number;
    comment: string;
    createdAt: Date;
  },
): Promise<ReviewRow> {
  await db.insert(reviews).values({
    id: input.id,
    productId: input.productId,
    userId: input.userId,
    authorName: input.authorName,
    rating: input.rating,
    comment: input.comment,
    helpful: 0,
    createdAt: input.createdAt,
  });
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error('Failed to create review');
  return row;
}

/** Recompute denormalized product rating + review_count from all reviews. */
export async function recomputeProductRating(
  db: Db,
  productId: string,
): Promise<{ rating: number; reviewCount: number }> {
  const [agg] = await db
    .select({
      avg: avg(reviews.rating),
      count: count(),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  const reviewCount = Number(agg?.count ?? 0);
  const rawAvg = agg?.avg != null ? Number(agg.avg) : 0;
  const rating =
    reviewCount === 0 ? 0 : Math.round(rawAvg * 10) / 10;

  await db
    .update(products)
    .set({ rating, reviewCount })
    .where(eq(products.id, productId));

  return { rating, reviewCount };
}

export async function ratingBreakdown(
  db: Db,
  productId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      rating: reviews.rating,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .groupBy(reviews.rating);

  const breakdown: Record<string, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };
  for (const row of rows) {
    breakdown[String(row.rating)] = row.count;
  }
  return breakdown;
}

export async function productExists(db: Db, productId: string): Promise<boolean> {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  return rows.length > 0;
}
