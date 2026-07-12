import { eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { users } from '@/server/db/schema';

export type UserRow = typeof users.$inferSelect;

export async function findUserByEmail(
  db: Db,
  email: string,
): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(db: Db, id: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(
  db: Db,
  input: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    passwordHash: string;
    role?: 'customer' | 'admin';
  },
): Promise<UserRow> {
  const now = new Date();
  await db.insert(users).values({
    id: input.id,
    email: input.email.toLowerCase(),
    name: input.name,
    phone: input.phone ?? null,
    passwordHash: input.passwordHash,
    role: input.role ?? 'customer',
    createdAt: now,
  });
  const row = await findUserById(db, input.id);
  if (!row) throw new Error('Failed to create user');
  return row;
}
