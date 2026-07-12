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
