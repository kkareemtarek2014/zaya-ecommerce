import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const governorates = sqliteTable('governorates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  zone: text('zone', {
    enum: ['cairo_giza', 'near', 'far'],
  }).notNull(),
  /** Bosta city id or accepted city name (P14). */
  bostaCityId: text('bosta_city_id'),
  bostaZone: text('bosta_zone'),
  bostaDistrict: text('bosta_district'),
});
