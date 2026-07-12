import { and, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { favorites } from '@/server/db/schema';

export async function listFavoriteProductIds(
  db: Db,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ productId: favorites.productId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  return rows.map((r) => r.productId);
}

/** Replace the user's favorites set entirely. */
export async function replaceFavorites(
  db: Db,
  userId: string,
  productIds: string[],
): Promise<string[]> {
  await db.delete(favorites).where(eq(favorites.userId, userId));
  const unique = [...new Set(productIds)];
  const now = new Date();
  if (unique.length > 0) {
    await db.insert(favorites).values(
      unique.map((productId) => ({
        userId,
        productId,
        createdAt: now,
      })),
    );
  }
  return unique;
}

export async function deleteFavorite(
  db: Db,
  userId: string,
  productId: string,
): Promise<void> {
  await db
    .delete(favorites)
    .where(
      and(eq(favorites.userId, userId), eq(favorites.productId, productId)),
    );
}
