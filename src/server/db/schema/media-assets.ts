import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  folder: text('folder'),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
