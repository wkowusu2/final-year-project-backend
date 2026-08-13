import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  deleted: boolean().notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
