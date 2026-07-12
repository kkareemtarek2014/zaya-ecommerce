import type { Db } from '@/server/db/client';
import { bridalRequests } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

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
