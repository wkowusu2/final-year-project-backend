import { bigint, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { admins } from './admins.js';

export const roadAdvisories = pgTable('road_advisories', {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 160 }).notNull(),
  description: text().notNull(),
  type: varchar({ length: 40 }).notNull(),
  status: varchar({ length: 20 }).notNull().default('planned'),
  impact: varchar({ length: 20 }).notNull().default('moderate'),
  affectedRoadOsmId: bigint('affected_road_osm_id', { mode: 'bigint' }),
  roadName: text('road_name').notNull(),
  city: text().notNull(),
  latitude: real(),
  longitude: real(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  publishedByAdminId: uuid('published_by_admin_id').notNull().references(() => admins.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
