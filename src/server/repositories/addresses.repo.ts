import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { addresses } from '@/server/db/schema';

export type AddressRow = typeof addresses.$inferSelect;

export async function listAddressesByUser(
  db: Db,
  userId: string,
): Promise<AddressRow[]> {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.id));
}

export async function createAddress(
  db: Db,
  input: {
    id: string;
    userId: string;
    label: string;
    governorateId: string;
    city: string;
    street: string;
  },
): Promise<AddressRow> {
  await db.insert(addresses).values(input);
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error('Failed to create address');
  return row;
}

export async function findAddressById(
  db: Db,
  id: string,
): Promise<AddressRow | null> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteAddressForUser(
  db: Db,
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .returning({ id: addresses.id });
  return result.length > 0;
}
