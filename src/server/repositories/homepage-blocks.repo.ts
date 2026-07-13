import 'server-only';
import { asc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { homepageBlocks } from '@/server/db/schema';
import type { HomepageBlockType } from '@/server/db/schema/homepage-blocks';

export type HomepageBlockRow = typeof homepageBlocks.$inferSelect;

export async function findActiveHomepageBlocks(
  db: Db,
): Promise<HomepageBlockRow[]> {
  return db
    .select()
    .from(homepageBlocks)
    .where(eq(homepageBlocks.active, true))
    .orderBy(asc(homepageBlocks.position), asc(homepageBlocks.createdAt));
}

export async function findAllHomepageBlocks(
  db: Db,
): Promise<HomepageBlockRow[]> {
  return db
    .select()
    .from(homepageBlocks)
    .orderBy(asc(homepageBlocks.position), asc(homepageBlocks.createdAt));
}

export async function findHomepageBlockById(
  db: Db,
  id: string,
): Promise<HomepageBlockRow | undefined> {
  const rows = await db
    .select()
    .from(homepageBlocks)
    .where(eq(homepageBlocks.id, id))
    .limit(1);
  return rows[0];
}

export async function insertHomepageBlock(
  db: Db,
  input: {
    id: string;
    type: HomepageBlockType;
    position: number;
    config: Record<string, unknown>;
    active: boolean;
    createdAt: Date;
  },
): Promise<HomepageBlockRow> {
  await db.insert(homepageBlocks).values({
    id: input.id,
    type: input.type,
    position: input.position,
    config: input.config,
    active: input.active,
    createdAt: input.createdAt,
  });
  const row = await findHomepageBlockById(db, input.id);
  if (!row) throw new Error('Failed to insert homepage block');
  return row;
}

export async function updateHomepageBlock(
  db: Db,
  id: string,
  patch: {
    type?: HomepageBlockType;
    position?: number;
    config?: Record<string, unknown>;
    active?: boolean;
  },
): Promise<HomepageBlockRow | undefined> {
  const existing = await findHomepageBlockById(db, id);
  if (!existing) return undefined;

  await db
    .update(homepageBlocks)
    .set({
      type: patch.type ?? existing.type,
      position: patch.position ?? existing.position,
      config: patch.config ?? existing.config,
      active: patch.active ?? existing.active,
    })
    .where(eq(homepageBlocks.id, id));

  return findHomepageBlockById(db, id);
}

export async function deleteHomepageBlock(
  db: Db,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(homepageBlocks)
    .where(eq(homepageBlocks.id, id))
    .returning({ id: homepageBlocks.id });
  return result.length > 0;
}

export async function reorderHomepageBlocks(
  db: Db,
  ids: string[],
): Promise<HomepageBlockRow[]> {
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index]!;
    await db
      .update(homepageBlocks)
      .set({ position: index })
      .where(eq(homepageBlocks.id, id));
  }
  return findAllHomepageBlocks(db);
}

export async function maxHomepageBlockPosition(db: Db): Promise<number> {
  const rows = await db
    .select({ position: homepageBlocks.position })
    .from(homepageBlocks)
    .orderBy(asc(homepageBlocks.position));
  if (rows.length === 0) return -1;
  return Math.max(...rows.map((r) => r.position));
}
