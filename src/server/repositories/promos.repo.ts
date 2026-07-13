import { eq } from 'drizzle-orm';
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
    .where(eq(promos.code, code.toUpperCase()))
    .limit(1);
  const row = rows[0];
  if (!row || !row.active) return null;
  return row;
}

export async function findPromoByCode(
  db: Db,
  code: string,
): Promise<PromoRow | null> {
  const rows = await db
    .select()
    .from(promos)
    .where(eq(promos.code, code.toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function findAllPromos(db: Db): Promise<PromoRow[]> {
  return db.select().from(promos);
}

export async function insertPromo(
  db: Db,
  input: {
    code: string;
    type: PromoRow['type'];
    value: number;
    minOrderValue?: number | null;
    maxRedemptions?: number | null;
    active?: boolean;
  },
): Promise<PromoRow> {
  await db.insert(promos).values({
    code: input.code.toUpperCase(),
    type: input.type,
    value: input.value,
    minOrderValue: input.minOrderValue ?? null,
    maxRedemptions: input.maxRedemptions ?? null,
    active: input.active ?? true,
  });
  const row = await findPromoByCode(db, input.code);
  if (!row) throw new Error('Failed to create promo');
  return row;
}

export async function updatePromo(
  db: Db,
  code: string,
  input: {
    type?: PromoRow['type'];
    value?: number;
    minOrderValue?: number | null;
    maxRedemptions?: number | null;
    active?: boolean;
  },
): Promise<PromoRow | null> {
  const patch: Partial<typeof promos.$inferInsert> = {};
  if (input.type !== undefined) patch.type = input.type;
  if (input.value !== undefined) patch.value = input.value;
  if (input.minOrderValue !== undefined) patch.minOrderValue = input.minOrderValue;
  if (input.maxRedemptions !== undefined)
    patch.maxRedemptions = input.maxRedemptions;
  if (input.active !== undefined) patch.active = input.active;
  if (Object.keys(patch).length === 0) return findPromoByCode(db, code);
  await db
    .update(promos)
    .set(patch)
    .where(eq(promos.code, code.toUpperCase()));
  return findPromoByCode(db, code);
}

export async function deletePromo(db: Db, code: string): Promise<boolean> {
  const existing = await findPromoByCode(db, code);
  if (!existing) return false;
  await db.delete(promos).where(eq(promos.code, code.toUpperCase()));
  return true;
}
