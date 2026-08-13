import { sql } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';

export type RouteGeometry = { type: 'LineString'; coordinates: [number, number][] };

type RouteTrafficRow = { sampleCount: number | string; medianSpeedKph: number | string | null; matchedRoadCount: number | string };
type RouteIncidentRow = { id: string; type: string; severity: string; roadName: string };

function routeGeoJson(geometry: RouteGeometry) {
  return JSON.stringify(geometry);
}

export async function getRouteTraffic(geometry: RouteGeometry) {
  const result = await getDb().execute<RouteTrafficRow>(sql`
    WITH route AS (
      SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${routeGeoJson(geometry)}), 4326), 3857) AS geometry
    )
    SELECT
      COUNT(*) AS "sampleCount",
      COUNT(DISTINCT gps_points.matched_road_osm_id) AS "matchedRoadCount",
      percentile_cont(0.5) WITHIN GROUP (ORDER BY gps_points.speed_mps * 3.6)
        FILTER (WHERE gps_points.speed_mps IS NOT NULL) AS "medianSpeedKph"
    FROM gps_points
    CROSS JOIN route
    WHERE gps_points.matched_position IS NOT NULL
      AND gps_points.recorded_at >= now() - interval '30 minutes'
      AND ST_DWithin(ST_Transform(gps_points.matched_position, 3857), route.geometry, 45)
  `);
  const row = result.rows[0];
  return {
    sampleCount: Number(row?.sampleCount ?? 0),
    matchedRoadCount: Number(row?.matchedRoadCount ?? 0),
    medianSpeedKph: row?.medianSpeedKph == null ? null : Number(row.medianSpeedKph),
  };
}

export async function getRouteIncidents(geometry: RouteGeometry) {
  const result = await getDb().execute<RouteIncidentRow>(sql`
    WITH route AS (
      SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${routeGeoJson(geometry)}), 4326), 3857) AS geometry
    )
    SELECT id, type, severity, road_name AS "roadName"
    FROM incidents
    CROSS JOIN route
    WHERE status <> 'resolved'
      AND ST_DWithin(
        ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857),
        route.geometry,
        80
      )
    ORDER BY created_at DESC
    LIMIT 5
  `);
  return result.rows;
}
