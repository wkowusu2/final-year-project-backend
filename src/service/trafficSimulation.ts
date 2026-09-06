import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';

import { getDb } from '../configs/db.config.js';
import { createIncident } from '../repository/incidents.js';
import { insertPoints, startOrGetActiveSession, TrackingPointInput } from '../repository/tracking.js';

const SIMULATION_DRIVER_IDS = Array.from({ length: 10 }, (_, index) => `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
const KNUST = { latitude: 6.6752, longitude: -1.5716 };
const TICK_MS = 5_000;

type Scenario = 'normal' | 'rush_hour' | 'incident';
type Road = { coordinates: [number, number][] };
type SimulatedDriver = { driverId: string; sessionId: string; road: Road; cursor: number };
type State = { scenario: Scenario; startedAt: string; drivers: SimulatedDriver[]; timer: NodeJS.Timeout; ticking: boolean; reportId: string | null };

let state: State | null = null;

/**
 * Simulation identities are reserved exclusively for presentation data. Removing
 * their sessions cascades to GPS points, so no generated observations remain in
 * the traffic window after a demo is stopped or restarted.
 */
async function clearSimulationData() {
  const driverIds = sql.join(SIMULATION_DRIVER_IDS.map((driverId) => sql`${driverId}::uuid`), sql`, `);
  await getDb().execute(sql`
    DELETE FROM incidents
    WHERE reporter_driver_id IN (${driverIds})
      AND type = 'Simulated traffic incident'
  `);
  await getDb().execute(sql`
    DELETE FROM tracking_sessions
    WHERE driver_id IN (${driverIds})
  `);
}

function speedFor(scenario: Scenario, index: number) {
  if (scenario === 'normal') return 12 + (index % 3); // 43–50 km/h
  if (scenario === 'rush_hour') return 3 + (index % 3); // 11–18 km/h
  return index % 3 === 0 ? 1.8 : 5; // incident bottleneck
}

async function findKnustRoads() {
  const result = await getDb().execute<{ geometry: Road | null }>(sql`
    WITH area AS (
      SELECT ST_Transform(ST_MakeEnvelope(${KNUST.longitude - 0.045}, ${KNUST.latitude - 0.035}, ${KNUST.longitude + 0.045}, ${KNUST.latitude + 0.035}, 4326), 3857) AS geometry
    )
    SELECT ST_AsGeoJSON(ST_Transform(roads.way, 4326))::json AS geometry
    FROM planet_osm_roads AS roads
    CROSS JOIN area
    WHERE roads.way && area.geometry
      AND roads.highway IN ('primary', 'secondary', 'tertiary', 'unclassified', 'residential')
      AND ST_Intersects(roads.way, area.geometry)
      AND ST_Length(roads.way) > 250
    ORDER BY ST_Length(roads.way) DESC
    LIMIT 4
  `);
  const roads = result.rows.flatMap((row) => row.geometry?.coordinates && row.geometry.coordinates.length > 3 ? [row.geometry] : []);
  if (roads.length < 1) throw new Error('No suitable KNUST road segments were found for the simulation');
  return roads;
}

async function emitPoints() {
  if (!state || state.ticking) return;
  state.ticking = true;
  try {
    const now = Date.now();
    await Promise.all(state.drivers.map(async (driver, index) => {
      const coordinates = driver.road.coordinates;
      const first = coordinates[driver.cursor % coordinates.length];
      driver.cursor = (driver.cursor + 1) % coordinates.length;
      const second = coordinates[driver.cursor % coordinates.length];
      const speedMps = speedFor(state!.scenario, index);
      const points: TrackingPointInput[] = [first, second].map(([longitude, latitude], pointIndex) => ({
        clientPointId: randomUUID(), latitude, longitude, speedMps, headingDegrees: 0, accuracyMeters: 5,
        recordedAt: new Date(now - (1 - pointIndex) * TICK_MS),
      }));
      await insertPoints(driver.driverId, driver.sessionId, points);
    }));
  } catch (error) {
    console.error('Traffic simulation tick failed:', error);
  } finally {
    if (state) state.ticking = false;
  }
}

export function simulationStatus() {
  return state ? { running: true, scenario: state.scenario, startedAt: state.startedAt, driverCount: state.drivers.length, reportId: state.reportId, center: KNUST } : { running: false, scenario: null, startedAt: null, driverCount: 0, reportId: null, center: KNUST };
}

export async function startSimulation(scenario: Scenario) {
  if (state) return simulationStatus();
  // Also recover cleanly if the server was restarted during an earlier demo.
  await clearSimulationData();
  const roads = await findKnustRoads();
  const sessions = await Promise.all(SIMULATION_DRIVER_IDS.map((driverId) => startOrGetActiveSession(driverId, new Date())));
  if (sessions.some((session) => !session)) throw new Error('Could not start all simulation tracking sessions');
  const report = await createIncident({
    reporterDriverId: SIMULATION_DRIVER_IDS[0], type: 'Simulated traffic incident',
    description: `Presentation simulation: ${scenario.replace('_', ' ')} conditions near KNUST.`,
    severity: scenario === 'incident' ? 'high' : 'medium', roadName: 'KNUST demonstration corridor', city: 'Kumasi',
    latitude: KNUST.latitude, longitude: KNUST.longitude,
  });
  const drivers = SIMULATION_DRIVER_IDS.map((driverId, index) => ({ driverId, sessionId: sessions[index]!.id, road: roads[index % roads.length], cursor: (index * 3) % roads[index % roads.length].coordinates.length }));
  const timer = setInterval(() => { void emitPoints(); }, TICK_MS);
  state = { scenario, startedAt: new Date().toISOString(), drivers, timer, ticking: false, reportId: report?.id ?? null };
  await emitPoints();
  return simulationStatus();
}

export async function stopSimulation() {
  if (state) clearInterval(state.timer);
  state = null;
  await clearSimulationData();
  return simulationStatus();
}
