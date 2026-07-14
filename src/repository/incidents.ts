import { sql } from 'drizzle-orm';

import { getDb } from '../configs/db.config.js';
import { incidentConfirmations } from '../schema/incidentConfirmations.js';
import { incidents } from '../schema/incidents.js';
import { incidentMedia } from '../schema/incidentMedia.js';

export type CreateIncidentInput = {
  reporterDriverId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  roadName: string;
  city: string;
  latitude: number;
  longitude: number;
};

export async function createIncident(input: CreateIncidentInput) {
  const db = getDb();
  const result = await db.insert(incidents).values(input).returning({
    id: incidents.id,
    type: incidents.type,
    severity: incidents.severity,
    status: incidents.status,
    roadName: incidents.roadName,
    city: incidents.city,
    createdAt: incidents.createdAt,
  });

  return result[0] ?? null;
}

export async function createIncidentMedia(input: { incidentId: string; storagePath: string; cloudinaryPublicId: string; originalFilename: string; mimeType: string; sizeBytes: number }) {
  const result = await getDb().insert(incidentMedia).values(input).returning({ id: incidentMedia.id, storagePath: incidentMedia.storagePath, cloudinaryPublicId: incidentMedia.cloudinaryPublicId });
  return result[0] ?? null;
}

export type IncidentStatusFilter = 'pending' | 'verified' | 'resolved';

type IncidentListRow = {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatusFilter;
  roadName: string;
  city: string;
  createdAt: Date | string;
};

type IncidentDetailRow = IncidentListRow & {
  description: string;
  reporterName: string;
  latitude: number;
  longitude: number;
  confirmationCount: number | string;
  confirmedByCurrentDriver: boolean;
  reportedByCurrentDriver: boolean;
};

export async function getDriverIncidents(driverId: string, status?: IncidentStatusFilter) {
  const db = getDb();
  const statusCondition = status ? sql`AND status = ${status}` : sql``;
  const result = await db.execute<IncidentListRow>(sql`
    SELECT id, type, severity, status, road_name AS "roadName", city, created_at AS "createdAt"
    FROM incidents
    WHERE reporter_driver_id = ${driverId} ${statusCondition}
    ORDER BY created_at DESC
  `);

  return result.rows.map((incident) => ({ ...incident, createdAt: toIsoTimestamp(incident.createdAt) }));
}

export async function getIncidentDetail(incidentId: string, currentDriverId: string) {
  const db = getDb();
  const result = await db.execute<IncidentDetailRow>(sql`
    SELECT
      incidents.id,
      incidents.type,
      incidents.description,
      incidents.severity,
      incidents.status,
      incidents.road_name AS "roadName",
      incidents.city,
      incidents.latitude,
      incidents.longitude,
      incidents.created_at AS "createdAt",
      drivers.full_name AS "reporterName",
      COUNT(incident_confirmations.id) AS "confirmationCount",
      COALESCE(BOOL_OR(incident_confirmations.driver_id = ${currentDriverId}), false) AS "confirmedByCurrentDriver",
      incidents.reporter_driver_id = ${currentDriverId} AS "reportedByCurrentDriver"
    FROM incidents
    INNER JOIN drivers ON drivers.id = incidents.reporter_driver_id
    LEFT JOIN incident_confirmations ON incident_confirmations.incident_id = incidents.id
    WHERE incidents.id = ${incidentId}
    GROUP BY incidents.id, drivers.full_name
    LIMIT 1
  `);
  const incident = result.rows[0];
  return incident
    ? { ...incident, confirmationCount: Number(incident.confirmationCount), createdAt: toIsoTimestamp(incident.createdAt) }
    : null;
}

function toIsoTimestamp(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Database returned an invalid incident timestamp');
  }
  return date.toISOString();
}

export async function confirmIncident(incidentId: string, driverId: string) {
  const db = getDb();
  const exists = await db.execute<{ id: string }>(sql`SELECT id FROM incidents WHERE id = ${incidentId} LIMIT 1`);
  if (!exists.rows[0]) return null;

  await db.insert(incidentConfirmations).values({ incidentId, driverId }).onConflictDoNothing();
  const confirmations = await db.execute<{ count: number | string }>(sql`
    SELECT COUNT(*) AS count
    FROM incident_confirmations
    WHERE incident_id = ${incidentId}
  `);
  return { confirmationCount: Number(confirmations.rows[0]?.count ?? 0), confirmedByCurrentDriver: true };
}
