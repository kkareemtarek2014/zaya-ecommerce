import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { products } from '@/server/db/schema';

export type ProductRow = typeof products.$inferSelect;

export type ProductListFilters = {
  category?: string;
  featured?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  q?: string;
  status?: 'published' | 'draft' | 'hidden' | 'archived';
};

export async function findProducts(
  db: Db,
  filters: ProductListFilters = {},
): Promise<ProductRow[]> {
  const status = filters.status ?? 'published';
  const conditions = [eq(products.status, status)];

  if (filters.category) {
    conditions.push(eq(products.categorySlug, filters.category));
  }
  if (filters.featured === true) {
    conditions.push(eq(products.featured, true));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${q} or lower(${products.categorySlug}) like ${q} or lower(coalesce(${products.tags}, '')) like ${q})`,
    );
  }

  const where = and(...conditions);

  switch (filters.sort) {
    case 'newest':
      return db.select().from(products).where(where).orderBy(desc(products.createdAt));
    case 'price-asc':
      return db.select().from(products).where(where).orderBy(asc(products.basePrice));
    case 'price-desc':
      return db.select().from(products).where(where).orderBy(desc(products.basePrice));
    case 'rating':
      return db.select().from(products).where(where).orderBy(desc(products.rating));
    default:
      return db.select().from(products).where(where);
  }
}

export async function findProductById(
  db: Db,
  id: string,
): Promise<ProductRow | null> {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.status, 'published')))
    .limit(1);
  return rows[0] ?? null;
}

export async function findRelatedProducts(
  db: Db,
  id: string,
  categorySlug: string,
  limit = 4,
): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        eq(products.categorySlug, categorySlug),
        ne(products.id, id),
      ),
    )
    .limit(limit);
}

export async function findNewArrivals(db: Db, limit = 8): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.status, 'published'))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function searchProducts(
  db: Db,
  query: string,
  limit = 8,
): Promise<ProductRow[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pattern = `%${q}%`;
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        sql`(lower(${products.name}) like ${pattern} or lower(${products.categorySlug}) like ${pattern} or lower(coalesce(${products.tags}, '')) like ${pattern})`,
      ),
    )
    .limit(limit);
}
