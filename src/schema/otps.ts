import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const otps = pgTable('otps', {
    id: uuid().primaryKey().defaultRandom(),
    code: integer().notNull().unique(),
    phone: varchar().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull()
})