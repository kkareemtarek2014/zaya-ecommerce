import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { payments } from '@/server/db/schema';

export type PaymentRow = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;

export async function insertPayment(
  db: Db,
  row: PaymentInsert,
): Promise<PaymentRow> {
  await db.insert(payments).values(row);
  const found = await findPaymentById(db, row.id);
  if (!found) throw new Error('Failed to insert payment');
  return found;
}

export async function findPaymentById(
  db: Db,
  id: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findLatestPaymentForOrder(
  db: Db,
  orderId: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function findPaymentByTransactionId(
  db: Db,
  transactionId: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.paymobTransactionId, transactionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findPaymentByIntentionId(
  db: Db,
  intentionId: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.paymobIntentionId, intentionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function updatePayment(
  db: Db,
  id: string,
  patch: Partial<
    Pick<
      PaymentRow,
      | 'paymobIntentionId'
      | 'paymobTransactionId'
      | 'clientSecret'
      | 'status'
      | 'raw'
      | 'updatedAt'
    >
  >,
): Promise<PaymentRow | null> {
  await db.update(payments).set(patch).where(eq(payments.id, id));
  return findPaymentById(db, id);
}

export async function findPendingPaymentForOrder(
  db: Db,
  orderId: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.orderId, orderId), eq(payments.status, 'pending')),
    )
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
