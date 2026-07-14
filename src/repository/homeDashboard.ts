import { sql } from 'drizzle-orm';

import { getDb } from '../configs/db.config.js';

type DashboardMetricsRow = {
  distanceMeters: number | string | null;
  tripCount: number | string;
  reportCount: number | string;
  currentSpeedMps: number | string | null;
  trackingActive: boolean;
};

type DriverRow = {
  fullName: string;
};

type IncidentRow = {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'resolved';
  roadName: string;
  city: string;
  createdAt: Date;
};

export async function getHomeDashboard(driverId: string) {
  const db = getDb();
  const driverResult = await db.execute<DriverRow>(sql`
    SELECT full_name AS "fullName"
    FROM drivers
    WHERE id = ${driverId} AND deleted = false
    LIMIT 1
  `);
  const driver = driverResult.rows[0];
  if (!driver) {
    return null;
  }

  const metricsResult = await db.execute<DashboardMetricsRow>(sql`
    WITH today_points AS (
      SELECT
        gps_points.session_id,
        gps_points.position,
        LAG(gps_points.position) OVER (
          PARTITION BY gps_points.session_id
          ORDER BY gps_points.recorded_at
        ) AS previous_position
      FROM gps_points
      INNER JOIN tracking_sessions ON tracking_sessions.id = gps_points.session_id
      WHERE tracking_sessions.driver_id = ${driverId}
        AND gps_points.recorded_at >= date_trunc('day', now())
    )
    SELECT
      COALESCE((
        SELECT SUM(ST_DistanceSphere(position, previous_position))
        FROM today_points
        WHERE previous_position IS NOT NULL
      ), 0) AS "distanceMeters",
      (
        SELECT COUNT(*)
        FROM tracking_sessions
        WHERE driver_id = ${driverId}
          AND started_at >= date_trunc('day', now())
      ) AS "tripCount",
      (
        SELECT COUNT(*)
        FROM incidents
        WHERE reporter_driver_id = ${driverId}
      ) AS "reportCount",
      (
        SELECT speed_mps
        FROM gps_points
        INNER JOIN tracking_sessions ON tracking_sessions.id = gps_points.session_id
        WHERE tracking_sessions.driver_id = ${driverId}
          AND tracking_sessions.status = 'active'
        ORDER BY gps_points.recorded_at DESC
        LIMIT 1
      ) AS "currentSpeedMps",
      EXISTS(
        SELECT 1
        FROM tracking_sessions
        WHERE driver_id = ${driverId} AND status = 'active'
      ) AS "trackingActive"
  `);
  const metrics = metricsResult.rows[0];

  const incidentsResult = await db.execute<IncidentRow>(sql`
    SELECT
      id,
      type,
      severity,
      status,
      road_name AS "roadName",
      city,
      created_at AS "createdAt"
    FROM incidents
    ORDER BY created_at DESC
    LIMIT 3
  `);

  return {
    driver: {
      fullName: driver.fullName,
      location: 'Accra, Greater Accra',
    },
    metrics: {
      distanceMeters: Number(metrics?.distanceMeters ?? 0),
      tripCount: Number(metrics?.tripCount ?? 0),
      reportCount: Number(metrics?.reportCount ?? 0),
      currentSpeedMps: metrics?.currentSpeedMps == null ? null : Number(metrics.currentSpeedMps),
      trackingActive: Boolean(metrics?.trackingActive),
    },
    incidents: incidentsResult.rows.map((incident) => ({
      ...incident,
      createdAt: incident.createdAt.toISOString(),
    })),
  };
}
