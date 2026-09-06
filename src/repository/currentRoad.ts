import { sql } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';

type CurrentRoadRow = { osmId: string; roadName: string | null; roadRef: string | null; sampleCount: number | string; medianSpeedKph: number | string | null; advisoryCount: number | string; incidentCount: number | string };

export async function getCurrentRoadCondition(driverId: string) {
  const result = await getDb().execute<CurrentRoadRow>(sql`
    WITH latest AS (
      SELECT gps_points.matched_road_osm_id, gps_points.matched_position
      FROM gps_points
      INNER JOIN tracking_sessions ON tracking_sessions.id = gps_points.session_id
      WHERE tracking_sessions.driver_id = ${driverId}::uuid
        AND tracking_sessions.status = 'active'
        AND gps_points.matched_road_osm_id IS NOT NULL
      ORDER BY gps_points.recorded_at DESC
      LIMIT 1
    ), traffic AS (
      SELECT COUNT(*) AS sample_count, percentile_cont(0.5) WITHIN GROUP (ORDER BY gps_points.speed_mps * 3.6) FILTER (WHERE gps_points.speed_mps IS NOT NULL) AS median_speed_kph
      FROM gps_points CROSS JOIN latest
      WHERE gps_points.matched_road_osm_id = latest.matched_road_osm_id
        AND gps_points.recorded_at >= now() - interval '30 minutes'
    )
    SELECT latest.matched_road_osm_id::text AS "osmId", roads.name AS "roadName", roads.ref AS "roadRef", traffic.sample_count AS "sampleCount", traffic.median_speed_kph AS "medianSpeedKph",
      (SELECT COUNT(*) FROM road_advisories WHERE affected_road_osm_id = latest.matched_road_osm_id AND status = 'active' AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now())) AS "advisoryCount",
      (SELECT COUNT(*) FROM incidents WHERE status <> 'resolved' AND ST_DWithin(ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857), ST_Transform(latest.matched_position, 3857), 120)) AS "incidentCount"
    FROM latest
    LEFT JOIN planet_osm_roads roads ON roads.osm_id = latest.matched_road_osm_id
    CROSS JOIN traffic
  `);
  const row = result.rows[0];
  if (!row) return null;
  const medianSpeedKph = row.medianSpeedKph == null ? null : Number(row.medianSpeedKph);
  const trafficLevel = medianSpeedKph == null || Number(row.sampleCount) < 3 ? 'unknown' : medianSpeedKph < 12 ? 'severe' : medianSpeedKph < 25 ? 'heavy' : medianSpeedKph < 40 ? 'moderate' : 'free';
  return { osmId: row.osmId, roadName: row.roadName ?? row.roadRef ?? `OSM road ${row.osmId}`, medianSpeedKph, sampleCount: Number(row.sampleCount), trafficLevel, advisoryCount: Number(row.advisoryCount), incidentCount: Number(row.incidentCount) };
}
