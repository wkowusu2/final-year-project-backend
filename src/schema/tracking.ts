import { sql } from 'drizzle-orm';
import { customType, index, pgTable, real, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { drivers } from './driverProfiles.js';
import { trackingSessionStatuses } from './enums.js';

const pointGeometry = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'geometry(Point,4326)';
    },
});

export const trackingSessions = pgTable('tracking_sessions', {
    id: uuid().primaryKey().defaultRandom(),
    driverId: uuid('driver_id').notNull().references(() => drivers.id, { onDelete: 'restrict' }),
    status: trackingSessionStatuses().notNull().default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('tracking_sessions_driver_started_idx').on(table.driverId, table.startedAt),
    index('tracking_sessions_status_started_idx').on(table.status, table.startedAt),
    uniqueIndex('tracking_sessions_one_active_driver_idx').on(table.driverId).where(sql`${table.status} = 'active'`),
]);

export const gpsPoints = pgTable('gps_points', {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull().references(() => trackingSessions.id, { onDelete: 'cascade' }),
    position: pointGeometry().notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    speedMps: real('speed_mps'),
    headingDegrees: real('heading_degrees'),
    accuracyMeters: real('accuracy_meters'),
}, (table) => [
    index('gps_points_session_recorded_idx').on(table.sessionId, table.recordedAt),
    index('gps_points_position_gist_idx').using('gist', table.position),
]);
