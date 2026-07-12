import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actorId: text('actor_id')
    .notNull()
    .references(() => users.id),
  action: text('action', {
    enum: ['create', 'update', 'delete', 'status_change'],
  }).notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  meta: text('meta', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
