import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { drivers } from './driverProfiles.js';
import { incidents } from './incidents.js';

export const incidentConfirmations = pgTable('incident_confirmations', {
  id: uuid().primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  driverId: uuid('driver_id').notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('incident_confirmations_incident_driver_idx').on(table.incidentId, table.driverId),
  index('incident_confirmations_incident_idx').on(table.incidentId),
]);
