import { getDb } from '../configs/db.config.js';
import { incidents } from '../schema/incidents.js';

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
