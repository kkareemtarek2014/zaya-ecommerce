import { eq, and, gt } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { sessions } from '@/server/db/schema';

export type SessionRow = typeof sessions.$inferSelect;

export async function createSession(
  db: Db,
  input: { id: string; userId: string; expiresAt: Date },
): Promise<void> {
  await db.insert(sessions).values({
    id: input.id,
    userId: input.userId,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  });
}

export async function findValidSession(
  db: Db,
  sessionId: string,
): Promise<SessionRow | null> {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteSession(db: Db, sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteSessionsForUser(db: Db, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
