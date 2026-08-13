import { sql } from 'drizzle-orm';

import { getDb } from '../configs/db.config.js';

type ProfileRow = { fullName: string; email: string | null; phone: string };
type MetricsRow = { distanceMeters: number | string | null; trackingHours: number | string | null; reportCount: number | string; tripCount: number | string };

export async function getProfileSummary(driverId: string) {
  const db = getDb();
  const profileResult = await db.execute<ProfileRow>(sql`
    SELECT full_name AS "fullName", email, phone FROM drivers
    WHERE id = ${driverId} AND deleted = false LIMIT 1
  `);
  const profile = profileResult.rows[0];
  if (!profile) return null;

  const metricsResult = await db.execute<MetricsRow>(sql`
    WITH ordered_points AS (
      SELECT gps_points.session_id, gps_points.position,
        LAG(gps_points.position) OVER (PARTITION BY gps_points.session_id ORDER BY gps_points.recorded_at) AS previous_position
      FROM gps_points
      INNER JOIN tracking_sessions ON tracking_sessions.id = gps_points.session_id
      WHERE tracking_sessions.driver_id = ${driverId}
    )
    SELECT
      COALESCE((SELECT SUM(ST_DistanceSphere(position, previous_position)) FROM ordered_points WHERE previous_position IS NOT NULL), 0) AS "distanceMeters",
      COALESCE((SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))) / 3600 FROM tracking_sessions WHERE driver_id = ${driverId}), 0) AS "trackingHours",
      (SELECT COUNT(*) FROM incidents WHERE reporter_driver_id = ${driverId}) AS "reportCount",
      (SELECT COUNT(*) FROM tracking_sessions WHERE driver_id = ${driverId}) AS "tripCount"
  `);
  const metrics = metricsResult.rows[0];
  const distanceKm = Number(metrics?.distanceMeters ?? 0) / 1000;
  const trackingHours = Number(metrics?.trackingHours ?? 0);
  const reportCount = Number(metrics?.reportCount ?? 0);
  const tripCount = Number(metrics?.tripCount ?? 0);
  const contributionScore = Math.round(distanceKm * 2 + trackingHours * 5 + reportCount * 50);
  const contributionLevel = contributionScore >= 5000 ? 'Platinum contributor' : contributionScore >= 2500 ? 'Gold contributor' : contributionScore >= 1000 ? 'Silver contributor' : 'Community contributor';

  return { profile, metrics: { distanceKm, trackingHours, reportCount, tripCount, contributionScore, contributionLevel } };
}
