import { sql } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';

const ROAD_MATCH_MAX_DISTANCE_METERS = 35;

const DRIVABLE_HIGHWAY_TYPES = [
    'motorway',
    'motorway_link',
    'trunk',
    'trunk_link',
    'primary',
    'primary_link',
    'secondary',
    'secondary_link',
    'tertiary',
    'tertiary_link',
    'unclassified',
    'residential',
    'living_street',
];

export type TrackingPointInput = {
    clientPointId: string;
    latitude: number;
    longitude: number;
    speedMps: number | null;
    headingDegrees: number | null;
    accuracyMeters: number | null;
    recordedAt: Date;
};

type InsertedPointRow = {
    clientPointId: string;
    matchedRoadOsmId: string | null;
    matchDistanceMeters: number | string | null;
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
        ${point.clientPointId}::uuid,
        ${point.latitude}::double precision,
        ${point.longitude}::double precision,
        ${point.recordedAt}::timestamptz,
        ${point.speedMps}::real,
        ${point.headingDegrees}::real,
        ${point.accuracyMeters}::real
    )`), sql`, `);
    const result = await db.execute<InsertedPointRow>(sql`
        WITH incoming (client_point_id, latitude, longitude, recorded_at, speed_mps, heading_degrees, accuracy_meters) AS (
            VALUES ${values}
        ),
        positioned AS (
            SELECT
                incoming.*,
                ST_Transform(
                    ST_SetSRID(ST_MakePoint(incoming.longitude, incoming.latitude), 4326),
                    3857
                ) AS position_3857
            FROM incoming
        ),
        matched AS (
            SELECT
                positioned.*,
                road.osm_id AS matched_road_osm_id,
                CASE
                    WHEN road.way IS NULL THEN NULL
                    ELSE ST_Distance(road.way, positioned.position_3857)
                END AS match_distance_meters,
                CASE
                    WHEN road.way IS NULL THEN NULL
                    ELSE ST_Transform(ST_ClosestPoint(road.way, positioned.position_3857), 4326)
                END AS matched_position
            FROM positioned
            LEFT JOIN LATERAL (
                SELECT roads.osm_id, roads.way
                FROM planet_osm_roads AS roads
                WHERE roads.highway IN (${sql.join(DRIVABLE_HIGHWAY_TYPES.map((highway) => sql`${highway}`), sql`, `)})
                  AND roads.way IS NOT NULL
                  AND ST_DWithin(roads.way, positioned.position_3857, ${ROAD_MATCH_MAX_DISTANCE_METERS})
                ORDER BY roads.way <-> positioned.position_3857
                LIMIT 1
            ) AS road ON TRUE
        )
        INSERT INTO gps_points (
            session_id,
            client_point_id,
            position,
            matched_road_osm_id,
            match_distance_meters,
            matched_position,
            recorded_at,
            speed_mps,
            heading_degrees,
            accuracy_meters
        )
        SELECT
            ${sessionId}::uuid,
            client_point_id,
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
            matched_road_osm_id,
            match_distance_meters,
            matched_position,
            recorded_at,
            speed_mps,
            heading_degrees,
            accuracy_meters
        FROM matched
        ON CONFLICT (session_id, client_point_id) DO NOTHING
        RETURNING
            client_point_id AS "clientPointId",
            matched_road_osm_id AS "matchedRoadOsmId",
            match_distance_meters AS "matchDistanceMeters"
    `);

    const matchResults = result.rows.map((point) => ({
        clientPointId: point.clientPointId,
        matchedRoadOsmId: point.matchedRoadOsmId,
        matchDistanceMeters: point.matchDistanceMeters == null ? null : Number(point.matchDistanceMeters),
    }));
    console.info('GPS point road-matching results', {
        sessionId,
        acceptedPointCount: matchResults.length,
        matchedPointCount: matchResults.filter((point) => point.matchedRoadOsmId !== null).length,
        unmatchedPointCount: matchResults.filter((point) => point.matchedRoadOsmId === null).length,
        points: matchResults,
    });

    return {
        state: 'active' as const,
        acceptedClientPointIds: matchResults.map((point) => point.clientPointId),
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
