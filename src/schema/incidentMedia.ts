import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { incidents } from './incidents.js';

export const incidentMedia = pgTable('incident_media', {
  id: uuid().primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  cloudinaryPublicId: text('cloudinary_public_id'),
  originalFilename: text('original_filename').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('incident_media_incident_idx').on(table.incidentId)]);
