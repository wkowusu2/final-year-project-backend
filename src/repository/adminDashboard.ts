import { sql } from 'drizzle-orm';

import { getDb } from '../configs/db.config.js';

type MetricsRow = {
  activeDrivers: number | string;
  matchedPointCount: number | string;
  monitoredRoadCount: number | string;
  pendingIncidentCount: number | string;
};

type TrafficRoadRow = {
  osmId: string;
  roadName: string | null;
  roadRef: string | null;
  highway: string | null;
  sampleCount: number | string;
  driverCount: number | string;
  medianSpeedKph: number | string | null;
};

type RecentIncidentRow = {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'resolved';
  roadName: string;
  city: string;
  createdAt: Date | string;
  reporterName: string;
  confirmationCount: number | string;
  latitude: number;
  longitude: number;
};

function isoTimestamp(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Database returned an invalid timestamp');
  return date.toISOString();
}

export async function getAdminDashboard(windowMinutes: number) {
  const db = getDb();
  const metricsResult = await db.execute<MetricsRow>(sql`
    SELECT
      (SELECT COUNT(*) FROM tracking_sessions WHERE status = 'active') AS "activeDrivers",
      (SELECT COUNT(*) FROM gps_points WHERE matched_road_osm_id IS NOT NULL AND recorded_at >= now() - (${windowMinutes} * interval '1 minute')) AS "matchedPointCount",
      (SELECT COUNT(DISTINCT matched_road_osm_id) FROM gps_points WHERE matched_road_osm_id IS NOT NULL AND recorded_at >= now() - (${windowMinutes} * interval '1 minute')) AS "monitoredRoadCount",
      (SELECT COUNT(*) FROM incidents WHERE status = 'pending') AS "pendingIncidentCount"
  `);

  const trafficResult = await db.execute<TrafficRoadRow>(sql`
    SELECT
      gps_points.matched_road_osm_id::text AS "osmId",
      MAX(road.name) AS "roadName",
      MAX(road.ref) AS "roadRef",
      MAX(road.highway) AS highway,
      COUNT(*) AS "sampleCount",
      COUNT(DISTINCT tracking_sessions.driver_id) AS "driverCount",
      percentile_cont(0.5) WITHIN GROUP (ORDER BY gps_points.speed_mps * 3.6)
        FILTER (WHERE gps_points.speed_mps IS NOT NULL) AS "medianSpeedKph"
    FROM gps_points
    INNER JOIN tracking_sessions ON tracking_sessions.id = gps_points.session_id
    LEFT JOIN LATERAL (
      SELECT name, ref, highway
      FROM planet_osm_roads
      WHERE osm_id = gps_points.matched_road_osm_id
      ORDER BY osm_id
      LIMIT 1
    ) AS road ON TRUE
    WHERE gps_points.matched_road_osm_id IS NOT NULL
      AND gps_points.recorded_at >= now() - (${windowMinutes} * interval '1 minute')
    GROUP BY gps_points.matched_road_osm_id
    ORDER BY "sampleCount" DESC, "medianSpeedKph" ASC NULLS LAST
    LIMIT 12
  `);

  const incidentsResult = await db.execute<RecentIncidentRow>(sql`
    SELECT
      incidents.id,
      incidents.type,
      incidents.severity,
      incidents.status,
      incidents.road_name AS "roadName",
      incidents.city,
      incidents.created_at AS "createdAt",
      incidents.latitude,
      incidents.longitude,
      drivers.full_name AS "reporterName",
      COUNT(incident_confirmations.id) AS "confirmationCount"
    FROM incidents
    INNER JOIN drivers ON drivers.id = incidents.reporter_driver_id
    LEFT JOIN incident_confirmations ON incident_confirmations.incident_id = incidents.id
    GROUP BY incidents.id, drivers.full_name
    ORDER BY incidents.created_at DESC
    LIMIT 8
  `);

  const metrics = metricsResult.rows[0];
  return {
    generatedAt: new Date().toISOString(),
    trafficWindowMinutes: windowMinutes,
    metrics: {
      activeDrivers: Number(metrics?.activeDrivers ?? 0),
      matchedPointCount: Number(metrics?.matchedPointCount ?? 0),
      monitoredRoadCount: Number(metrics?.monitoredRoadCount ?? 0),
      pendingIncidentCount: Number(metrics?.pendingIncidentCount ?? 0),
    },
    trafficRoads: trafficResult.rows.map((road) => ({
      osmId: road.osmId,
      roadName: road.roadName ?? road.roadRef ?? `OSM road ${road.osmId}`,
      roadRef: road.roadRef,
      highway: road.highway,
      sampleCount: Number(road.sampleCount),
      driverCount: Number(road.driverCount),
      medianSpeedKph: road.medianSpeedKph == null ? null : Number(road.medianSpeedKph),
    })),
    incidents: incidentsResult.rows.map((incident) => ({
      ...incident,
      confirmationCount: Number(incident.confirmationCount),
      createdAt: isoTimestamp(incident.createdAt),
    })),
  };
}
