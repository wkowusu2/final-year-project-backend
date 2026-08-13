import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { admins } from './admins.js';

export const adminRefreshTokens = pgTable('admin_refresh_tokens', {
  id: uuid().primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
  hashedRefreshToken: text('hashed_refresh_token').unique().notNull(),
  revoked: boolean().notNull().default(false),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
