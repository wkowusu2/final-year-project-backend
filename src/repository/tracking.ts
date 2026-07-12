import { sql } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';

export type TrackingPointInput = {
    clientPointId: string;
    latitude: number;
    longitude: number;
    speedMps: number | null;
    headingDegrees: number | null;
    accuracyMeters: number | null;
    recordedAt: Date;
};

type SessionRow = {
    id: string;
    status: 'active' | 'completed' | 'cancelled';
    startedAt: Date;
    endedAt: Date | null;
};

async function getSession(driverId: string, sessionId: string) {
    const db = getDb();
    const result = await db.execute<SessionRow>(sql`
        SELECT id, status, started_at AS "startedAt", ended_at AS "endedAt"
        FROM tracking_sessions
        WHERE id = ${sessionId} AND driver_id = ${driverId}
    `);
    return result.rows[0] ?? null;
}

export async function startOrGetActiveSession(driverId: string, startedAt: Date | null) {
    const db = getDb();
    await db.execute(sql`
        INSERT INTO tracking_sessions (driver_id, started_at)
        VALUES (${driverId}, COALESCE(${startedAt}, now()))
        ON CONFLICT DO NOTHING
    `);

    const result = await db.execute<SessionRow>(sql`
        SELECT id, status, started_at AS "startedAt", ended_at AS "endedAt"
        FROM tracking_sessions
        WHERE driver_id = ${driverId} AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1
    `);
    return result.rows[0] ?? null;
}

export async function getActiveSession(driverId: string) {
    const db = getDb();
    const result = await db.execute<SessionRow>(sql`
        SELECT id, status, started_at AS "startedAt", ended_at AS "endedAt"
        FROM tracking_sessions
        WHERE driver_id = ${driverId} AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1
    `);
    return result.rows[0] ?? null;
}

export async function insertPoints(driverId: string, sessionId: string, points: TrackingPointInput[]) {
    const session = await getSession(driverId, sessionId);
    if (!session) {
        return { state: 'missing' as const };
    }
    if (session.status !== 'active') {
        return { state: 'inactive' as const };
    }

    const db = getDb();
    const values = sql.join(points.map((point) => sql`(
        ${sessionId},
        ${point.clientPointId},
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326),
        ${point.recordedAt},
        ${point.speedMps},
        ${point.headingDegrees},
        ${point.accuracyMeters}
    )`), sql`, `);
    const result = await db.execute<{ clientPointId: string }>(sql`
        INSERT INTO gps_points (
            session_id,
            client_point_id,
            position,
            recorded_at,
            speed_mps,
            heading_degrees,
            accuracy_meters
        ) VALUES ${values}
        ON CONFLICT (session_id, client_point_id) DO NOTHING
        RETURNING client_point_id AS "clientPointId"
    `);

    return {
        state: 'active' as const,
        acceptedClientPointIds: result.rows.map((point) => point.clientPointId),
    };
}

export async function completeSession(driverId: string, sessionId: string, endedAt: Date | null) {
    const session = await getSession(driverId, sessionId);
    if (!session) {
        return { state: 'missing' as const };
    }
    if (session.status === 'cancelled') {
        return { state: 'cancelled' as const };
    }
    if (session.status === 'completed') {
        return { state: 'completed' as const, session };
    }

    const db = getDb();
    const result = await db.execute<SessionRow>(sql`
        UPDATE tracking_sessions
        SET status = 'completed',
            ended_at = COALESCE(${endedAt}, now()),
            updated_at = now()
        WHERE id = ${sessionId} AND driver_id = ${driverId} AND status = 'active'
        RETURNING id, status, started_at AS "startedAt", ended_at AS "endedAt"
    `);

    return result.rows[0]
        ? { state: 'completed' as const, session: result.rows[0] }
        : { state: 'inactive' as const };
}
