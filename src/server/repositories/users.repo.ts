import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orders, users } from '@/server/db/schema';

export type UserRow = typeof users.$inferSelect;

export type AdminUserListFilters = {
  q?: string;
  role?: 'customer' | 'admin';
  page?: number;
  pageSize?: number;
};

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

export async function updateUserProfile(
  db: Db,
  userId: string,
  input: { name: string; phone?: string | null },
): Promise<UserRow> {
  await db
    .update(users)
    .set({
      name: input.name,
      phone: input.phone ?? null,
    })
    .where(eq(users.id, userId));
  const row = await findUserById(db, userId);
  if (!row) throw new Error('User not found after update');
  return row;
}

export async function updateUserAdmin(
  db: Db,
  userId: string,
  input: {
    name?: string;
    phone?: string | null;
    role?: 'customer' | 'admin';
  },
): Promise<UserRow | null> {
  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.role !== undefined) patch.role = input.role;
  if (Object.keys(patch).length === 0) {
    return findUserById(db, userId);
  }
  await db.update(users).set(patch).where(eq(users.id, userId));
  return findUserById(db, userId);
}

export async function deleteUser(db: Db, userId: string): Promise<boolean> {
  const existing = await findUserById(db, userId);
  if (!existing) return false;
  await db.delete(users).where(eq(users.id, userId));
  return true;
}

export async function countAdmins(db: Db): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, 'admin'));
  return rows[0]?.value ?? 0;
}

export async function listAdminUsers(
  db: Db,
  filters: AdminUserListFilters = {},
): Promise<{
  rows: (UserRow & { ordersCount: number })[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const conditions = [];

  if (filters.role) {
    conditions.push(eq(users.role, filters.role));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${users.email}) like ${q} or lower(${users.name}) like ${q} or lower(coalesce(${users.phone}, '')) like ${q})`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRows = await db
    .select({ value: count() })
    .from(users)
    .where(where);
  const total = totalRows[0]?.value ?? 0;

  const userRows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const rows: (UserRow & { ordersCount: number })[] = [];
  for (const user of userRows) {
    const c = await db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.userId, user.id));
    rows.push({ ...user, ordersCount: c[0]?.value ?? 0 });
  }

  return { rows, total, page, pageSize };
}
