import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const refreshToken = pgTable('refresh_tokens', {
    id: uuid().primaryKey().defaultRandom(),
    phone: varchar().notNull().references(() => users.phone, {
        onDelete: 'cascade'
    }),
    hashedRefreshToken: text('hashed_refresh_token').unique().notNull(),
    revoked: boolean().default(false),
    revokedAt: timestamp('revoked_at'), 
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow(),
})