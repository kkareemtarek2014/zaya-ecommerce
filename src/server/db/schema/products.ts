import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categorySlug: text('category_slug')
    .notNull()
    .references(() => categories.slug),
  basePrice: integer('base_price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  description: text('description').notNull(),
  images: text('images', { mode: 'json' }).$type<string[]>().notNull(),
  rating: real('rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  slug: text('slug').unique(),
  sku: text('sku').unique(),
  status: text('status', {
    enum: ['draft', 'published', 'hidden', 'archived'],
  })
    .notNull()
    .default('draft'),
  stockQty: integer('stock_qty').notNull().default(0),
  reservedQty: integer('reserved_qty').notNull().default(0),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  ogImage: text('og_image'),
  canonicalUrl: text('canonical_url'),
  descriptionFormat: text('description_format', { enum: ['plain', 'html'] })
    .notNull()
    .default('plain'),
  archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
  /** Temu / USD source cost — server-only (P24). */
  basePriceUsd: real('base_price_usd'),
  /** Last landed-cost snapshot in EGP — server-only (P24). */
  landedCost: integer('landed_cost'),
  /** P25 sourcing */
  sourceProvider: text('source_provider'),
  sourceUrl: text('source_url'),
  sourceProductId: text('source_product_id'),
  sourceVariantMap: text('source_variant_map', { mode: 'json' }).$type<
    Record<string, unknown>
  >(),
  sourceInStock: integer('source_in_stock', { mode: 'boolean' }),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp_ms' }),
  fulfilmentType: text('fulfilment_type', {
    enum: ['local_stock', 'dropship'],
  })
    .notNull()
    .default('local_stock'),
  /** P26 pre-orders */
  preorderEnabled: integer('preorder_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  preorderEtaDays: integer('preorder_eta_days'),
});
