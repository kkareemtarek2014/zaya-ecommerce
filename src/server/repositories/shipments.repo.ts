import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { shipments } from '@/server/db/schema';

export type ShipmentRow = typeof shipments.$inferSelect;
export type ShipmentInsert = typeof shipments.$inferInsert;

export async function insertShipment(
  db: Db,
  row: ShipmentInsert,
): Promise<ShipmentRow> {
  await db.insert(shipments).values(row);
  const found = await findShipmentById(db, row.id);
  if (!found) throw new Error('Failed to insert shipment');
  return found;
}

export async function findShipmentById(
  db: Db,
  id: string,
): Promise<ShipmentRow | null> {
  const rows = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findShipmentByOrderId(
  db: Db,
  orderId: string,
): Promise<ShipmentRow | null> {
  const rows = await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, orderId))
    .orderBy(desc(shipments.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function findShipmentByDeliveryId(
  db: Db,
  deliveryId: string,
): Promise<ShipmentRow | null> {
  const rows = await db
    .select()
    .from(shipments)
    .where(eq(shipments.bostaDeliveryId, deliveryId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findShipmentByTracking(
  db: Db,
  trackingNumber: string,
): Promise<ShipmentRow | null> {
  const rows = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateShipment(
  db: Db,
  id: string,
  patch: Partial<
    Pick<
      ShipmentRow,
      | 'bostaDeliveryId'
      | 'trackingNumber'
      | 'bostaState'
      | 'lastEventId'
      | 'mappedStatus'
      | 'codAmount'
      | 'raw'
      | 'updatedAt'
    >
  >,
): Promise<ShipmentRow | null> {
  await db.update(shipments).set(patch).where(eq(shipments.id, id));
  return findShipmentById(db, id);
}

export type ShipmentListFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listShipments(
  db: Db,
  filters: ShipmentListFilters = {},
): Promise<{ rows: ShipmentRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const conditions = [];
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${shipments.orderId}) like ${q} or lower(coalesce(${shipments.trackingNumber}, '')) like ${q} or lower(coalesce(${shipments.bostaDeliveryId}, '')) like ${q})`,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const totalRows = await db
    .select({ value: sql<number>`count(*)` })
    .from(shipments)
    .where(where);
  const total = Number(totalRows[0]?.value ?? 0);

  const rows = await db
    .select()
    .from(shipments)
    .where(where)
    .orderBy(desc(shipments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, page, pageSize };
}
