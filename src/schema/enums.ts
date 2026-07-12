import { pgEnum } from "drizzle-orm/pg-core";

export const userRoles = pgEnum('user_roles', ['driver', 'admin']);
export const trackingSessionStatuses = pgEnum('tracking_session_status', ['active', 'completed', 'cancelled']);