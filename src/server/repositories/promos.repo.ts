import { and, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { promos } from '@/server/db/schema';

export type PromoRow = typeof promos.$inferSelect;

export async function findActivePromoByCode(
  db: Db,
  code: string,
): Promise<PromoRow | null> {
  const rows = await db
    .select()
    .from(promos)
    .where(and(eq(promos.code, code.toUpperCase()), eq(promos.active, true)))
    .limit(1);
  return rows[0] ?? null;
}
