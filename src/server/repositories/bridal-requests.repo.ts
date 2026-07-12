import { and, count, desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { bridalRequests } from '@/server/db/schema';

export type BridalRequestRow = typeof bridalRequests.$inferSelect;

export async function createBridalRequest(
  db: Db,
  input: {
    id: string;
    userId?: string | null;
    fullName: string;
    phone: string;
    weddingDate?: string | null;
    description: string;
    fileKey?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    createdAt: Date;
  },
): Promise<BridalRequestRow> {
  await db.insert(bridalRequests).values({
    id: input.id,
    userId: input.userId ?? null,
    fullName: input.fullName,
    phone: input.phone,
    weddingDate: input.weddingDate ?? null,
    description: input.description,
    fileKey: input.fileKey ?? null,
    fileName: input.fileName ?? null,
    fileType: input.fileType ?? null,
    status: 'pending',
    createdAt: input.createdAt,
  });
  const rows = await db
    .select()
    .from(bridalRequests)
    .where(eq(bridalRequests.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error('Failed to create bridal request');
  return row;
}

export async function findBridalRequestById(
  db: Db,
  id: string,
): Promise<BridalRequestRow | null> {
  const rows = await db
    .select()
    .from(bridalRequests)
    .where(eq(bridalRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listBridalRequests(
  db: Db,
  filters: {
    status?: 'pending' | 'answered';
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{
  rows: BridalRequestRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(bridalRequests.status, filters.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRows = await db
    .select({ value: count() })
    .from(bridalRequests)
    .where(where);
  const total = totalRows[0]?.value ?? 0;

  const rows = await db
    .select()
    .from(bridalRequests)
    .where(where)
    .orderBy(desc(bridalRequests.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, page, pageSize };
}

export async function updateBridalStatus(
  db: Db,
  id: string,
  status: 'pending' | 'answered',
): Promise<BridalRequestRow | null> {
  await db
    .update(bridalRequests)
    .set({ status })
    .where(eq(bridalRequests.id, id));
  return findBridalRequestById(db, id);
}
