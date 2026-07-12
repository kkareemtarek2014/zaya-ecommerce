import { asc, count, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import {
  addresses,
  governorates,
  orders,
  shippingZones,
} from '@/server/db/schema';

export type GovernorateRow = typeof governorates.$inferSelect;
export type ShippingZoneRow = typeof shippingZones.$inferSelect;

export async function findAllGovernorates(db: Db): Promise<GovernorateRow[]> {
  return db.select().from(governorates).orderBy(asc(governorates.name));
}

export async function findGovernorateById(
  db: Db,
  id: string,
): Promise<GovernorateRow | null> {
  const rows = await db
    .select()
    .from(governorates)
    .where(eq(governorates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertGovernorate(
  db: Db,
  input: { id: string; name: string; zone: GovernorateRow['zone'] },
): Promise<GovernorateRow> {
  await db.insert(governorates).values(input);
  const row = await findGovernorateById(db, input.id);
  if (!row) throw new Error('Failed to create governorate');
  return row;
}

export async function updateGovernorate(
  db: Db,
  id: string,
  input: { name?: string; zone?: GovernorateRow['zone'] },
): Promise<GovernorateRow | null> {
  const patch: Partial<typeof governorates.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.zone !== undefined) patch.zone = input.zone;
  if (Object.keys(patch).length === 0) return findGovernorateById(db, id);
  await db.update(governorates).set(patch).where(eq(governorates.id, id));
  return findGovernorateById(db, id);
}

export async function deleteGovernorate(db: Db, id: string): Promise<boolean> {
  const existing = await findGovernorateById(db, id);
  if (!existing) return false;
  await db.delete(governorates).where(eq(governorates.id, id));
  return true;
}

export async function countGovernorateRefs(
  db: Db,
  id: string,
): Promise<number> {
  const orderRows = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.governorateId, id));
  const addrRows = await db
    .select({ value: count() })
    .from(addresses)
    .where(eq(addresses.governorateId, id));
  return (orderRows[0]?.value ?? 0) + (addrRows[0]?.value ?? 0);
}

export async function findAllShippingZones(
  db: Db,
): Promise<ShippingZoneRow[]> {
  return db.select().from(shippingZones);
}

export async function findShippingZone(
  db: Db,
  zone: ShippingZoneRow['zone'],
): Promise<ShippingZoneRow | null> {
  const rows = await db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.zone, zone))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateShippingZoneFee(
  db: Db,
  zone: ShippingZoneRow['zone'],
  fee: number,
): Promise<ShippingZoneRow | null> {
  await db
    .update(shippingZones)
    .set({ fee })
    .where(eq(shippingZones.zone, zone));
  return findShippingZone(db, zone);
}
