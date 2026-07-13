import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orders, promoRedemptions, users } from '@/server/db/schema';

export type PromoRedemptionRow = typeof promoRedemptions.$inferSelect;

export async function insertPromoRedemption(
  db: Db,
  input: {
    id: string;
    promoCode: string;
    orderId: string;
    userId: string | null;
    discount: number;
    createdAt: Date;
  },
): Promise<void> {
  await db.insert(promoRedemptions).values({
    id: input.id,
    promoCode: input.promoCode,
    orderId: input.orderId,
    userId: input.userId,
    discount: input.discount,
    createdAt: input.createdAt,
  });
}

export async function countRedemptionsByCode(
  db: Db,
  code: string,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(promoRedemptions)
    .where(eq(promoRedemptions.promoCode, code.toUpperCase()));
  return Number(row?.value ?? 0);
}

export async function sumDiscountByCode(db: Db, code: string): Promise<number> {
  const [row] = await db
    .select({
      value: sql<number>`coalesce(sum(${promoRedemptions.discount}), 0)`,
    })
    .from(promoRedemptions)
    .where(eq(promoRedemptions.promoCode, code.toUpperCase()));
  return Number(row?.value ?? 0);
}

export async function sumOrderRevenueByCode(
  db: Db,
  code: string,
): Promise<number> {
  const [row] = await db
    .select({
      value: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(promoRedemptions)
    .innerJoin(orders, eq(orders.id, promoRedemptions.orderId))
    .where(
      and(
        eq(promoRedemptions.promoCode, code.toUpperCase()),
        sql`${orders.status} != 'cancelled'`,
      ),
    );
  return Number(row?.value ?? 0);
}

export async function listRedemptionCustomers(
  db: Db,
  code: string,
  limit = 20,
): Promise<
  { userId: string | null; name: string | null; email: string | null; uses: number }[]
> {
  const rows = await db
    .select({
      userId: promoRedemptions.userId,
      name: users.name,
      email: users.email,
      uses: sql<number>`count(*)`,
    })
    .from(promoRedemptions)
    .leftJoin(users, eq(users.id, promoRedemptions.userId))
    .where(eq(promoRedemptions.promoCode, code.toUpperCase()))
    .groupBy(promoRedemptions.userId, users.name, users.email)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    uses: Number(r.uses),
  }));
}
