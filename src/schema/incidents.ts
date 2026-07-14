import { pgEnum, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { drivers } from './driverProfiles.js';

export const incidentSeverity = pgEnum('incident_severity', ['low', 'medium', 'high', 'critical']);
export const incidentStatus = pgEnum('incident_status', ['pending', 'verified', 'resolved']);

export const incidents = pgTable('incidents', {
  id: uuid().primaryKey().defaultRandom(),
  reporterDriverId: uuid('reporter_driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  type: varchar({ length: 80 }).notNull(),
  description: text().notNull(),
  severity: incidentSeverity().notNull().default('medium'),
  status: incidentStatus().notNull().default('pending'),
  roadName: text('road_name').notNull(),
  city: text().notNull(),
  latitude: real().notNull(),
  longitude: real().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
