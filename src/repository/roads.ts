import { sql } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';
import { errorReturnDb, successReturnDb } from '../utils/db.utils.js';

const ROAD_FEATURE_LIMIT = 1000;

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

type RoadRow = {
    id: string | null;
    highway: string | null;
    name: string | null;
    ref: string | null;
    geometry: { type: 'LineString'; coordinates: [number, number][] } | null;
};

type TrafficRow = {
    osmId: string;
    sampleCount: number | string;
    driverCount: number | string;
    medianSpeedKph: number | string | null;
    lastObservedAt: Date | string;
};

type SelectedRoadRow = {
    osmId: string;
    name: string | null;
    ref: string | null;
    highway: string;
    latitude: number | string;
    longitude: number | string;
};

/** Verifies that an advisory points to a road supplied by the road-picker map. */
export async function getDrivableRoadByOsmId(osmId: string) {
    const result = await getDb().execute<SelectedRoadRow>(sql`
        SELECT
            roads.osm_id::text AS "osmId",
            roads.name,
            roads.ref,
            roads.highway,
            ST_Y(ST_Transform(ST_LineInterpolatePoint(roads.way, 0.5), 4326)) AS latitude,
            ST_X(ST_Transform(ST_LineInterpolatePoint(roads.way, 0.5), 4326)) AS longitude
        FROM planet_osm_roads AS roads
        WHERE roads.osm_id = ${osmId}::bigint
          AND roads.highway IN (${sql.join(DRIVABLE_HIGHWAY_TYPES.map((highway) => sql`${highway}`), sql`, `)})
        LIMIT 1
    `);
    const road = result.rows[0];
    return road ? { ...road, latitude: Number(road.latitude), longitude: Number(road.longitude) } : null;
}

export async function getRoadsInViewport(west: number, south: number, east: number, north: number) {
    try {
        const db = getDb();
        const result = await db.execute<RoadRow>(sql`
            WITH viewport AS (
                SELECT ST_Transform(ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326), 3857) AS geometry
            )
            SELECT
                roads.osm_id::text AS id,
                roads.highway,
                roads.name,
                roads.ref,
                ST_AsGeoJSON(ST_Transform(roads.way, 4326))::json AS geometry
            FROM planet_osm_roads AS roads
            CROSS JOIN viewport
            WHERE roads.highway IN (${sql.join(DRIVABLE_HIGHWAY_TYPES.map((highway) => sql`${highway}`), sql`, `)})
              AND roads.way && viewport.geometry
              AND ST_Intersects(roads.way, viewport.geometry)
            ORDER BY roads.osm_id
            LIMIT ${ROAD_FEATURE_LIMIT + 1}
        `);

        const rows = result.rows;
        const truncated = rows.length > ROAD_FEATURE_LIMIT;
        const features = rows.slice(0, ROAD_FEATURE_LIMIT).flatMap((road) => {
            if (!road.id || !road.highway || !road.geometry || road.geometry.type !== 'LineString') {
                return [];
            }

            return [{
                type: 'Feature' as const,
                id: road.id,
                properties: {
                    highway: road.highway,
                    name: road.name,
                    ref: road.ref,
                },
                geometry: road.geometry,
            }];
        });

        return successReturnDb({
            type: 'FeatureCollection' as const,
            features,
            truncated,
        });
    } catch (error: any) {
        console.error('Error from getRoadsInViewport:', error);
        return errorReturnDb(error);
    }
}

/** Aggregated only: no individual driver locations leave the server. */
export async function getTrafficInViewport(west: number, south: number, east: number, north: number) {
    const db = getDb();
    const result = await db.execute<TrafficRow>(sql`
        SELECT
            gps_points.matched_road_osm_id::text AS "osmId",
            COUNT(*) AS "sampleCount",
            COUNT(DISTINCT tracking_sessions.driver_id) AS "driverCount",
            percentile_cont(0.5) WITHIN GROUP (ORDER BY gps_points.speed_mps * 3.6)
                FILTER (WHERE gps_points.speed_mps IS NOT NULL) AS "medianSpeedKph",
            MAX(gps_points.recorded_at) AS "lastObservedAt"
        FROM gps_points
        INNER JOIN tracking_sessions ON tracking_sessions.id = gps_points.session_id
        WHERE gps_points.matched_road_osm_id IS NOT NULL
          AND gps_points.recorded_at >= now() - interval '30 minutes'
          AND ST_X(gps_points.position) BETWEEN ${west} AND ${east}
          AND ST_Y(gps_points.position) BETWEEN ${south} AND ${north}
        GROUP BY gps_points.matched_road_osm_id
        HAVING COUNT(*) FILTER (WHERE gps_points.speed_mps IS NOT NULL) >= 3
        ORDER BY "sampleCount" DESC
        LIMIT 300
    `);

    return result.rows.map((road) => {
        const medianSpeedKph = road.medianSpeedKph == null ? null : Number(road.medianSpeedKph);
        const trafficLevel = medianSpeedKph == null
            ? 'unknown'
            : medianSpeedKph < 12 ? 'severe'
                : medianSpeedKph < 25 ? 'heavy'
                    : medianSpeedKph < 40 ? 'moderate'
                        : 'free';
        const observedAt = road.lastObservedAt instanceof Date ? road.lastObservedAt : new Date(road.lastObservedAt);
        return {
            osmId: road.osmId,
            sampleCount: Number(road.sampleCount),
            driverCount: Number(road.driverCount),
            medianSpeedKph,
            trafficLevel,
            lastObservedAt: observedAt.toISOString(),
        };
    });
}
