import 'server-only';
import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { fxRates } from '@/server/db/schema';

export type FxRateRow = typeof fxRates.$inferSelect;

export async function insertFxRate(
  db: Db,
  input: {
    id: string;
    base?: string;
    quote?: string;
    rate: number;
    source: string;
    fetchedAt: Date;
  },
): Promise<FxRateRow> {
  await db.insert(fxRates).values({
    id: input.id,
    base: input.base ?? 'USD',
    quote: input.quote ?? 'EGP',
    rate: input.rate,
    source: input.source,
    fetchedAt: input.fetchedAt,
  });
  const rows = await db
    .select()
    .from(fxRates)
    .where(eq(fxRates.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error('Failed to insert fx rate');
  return row;
}

export async function findLatestFxRate(
  db: Db,
): Promise<FxRateRow | undefined> {
  const rows = await db
    .select()
    .from(fxRates)
    .orderBy(desc(fxRates.fetchedAt))
    .limit(1);
  return rows[0];
}
