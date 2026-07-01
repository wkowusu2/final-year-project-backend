import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const drivers = pgTable('drivers', {
    id: uuid().primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    email: varchar({length: 255}).unique(),
    phone: varchar({length: 10}).unique().notNull(),
    deleted: boolean().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})