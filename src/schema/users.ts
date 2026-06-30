import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { userRoles } from "./enums.js";

export const users = pgTable('users', {
    id: uuid().primaryKey().defaultRandom(),
    fullName: text('full_name'),
    email: varchar({length: 255}).unique().notNull(),
    phone: varchar({length: 10}).unique().notNull(),
    deleted: boolean().default(false),
    role: userRoles().notNull().default('driver'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})