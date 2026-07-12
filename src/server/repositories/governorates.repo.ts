import { asc } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { governorates } from '@/server/db/schema';

export type GovernorateRow = typeof governorates.$inferSelect;

export async function findAllGovernorates(db: Db): Promise<GovernorateRow[]> {
  return db.select().from(governorates).orderBy(asc(governorates.name));
}
