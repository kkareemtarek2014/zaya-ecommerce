import 'server-only';
import { lt } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { sessions } from '@/server/db/schema';
import { markCronJobRun } from '@/server/jobs/config';

/** Delete expired auth sessions. */
export async function cleanupSessionsJob(
  db: Db,
): Promise<{ deleted: number }> {
  const now = new Date();
  const removed = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });

  await markCronJobRun(db, 'cleanup-sessions');
  return { deleted: removed.length };
}
