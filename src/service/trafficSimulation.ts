import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';
import { AYEDUASE_SIMULATION_CORRIDOR } from '../configs/simulationCorridors.js';
import { createIncident } from '../repository/incidents.js';
import { insertPoints, startOrGetActiveSession, TrackingPointInput } from '../repository/tracking.js';

const SIMULATION_DRIVER_IDS = Array.from({ length: 110 }, (_, index) => `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
const DRIVERS_PER_CORRIDOR = 10;
const KUMASI = { latitude: 6.6752, longitude: -1.5716 };
const TICK_MS = 8_000;

type Scenario = 'normal' | 'rush_hour' | 'incident';
type TrafficLevel = 'free' | 'moderate' | 'heavy' | 'severe';
type Road = { coordinates: [number, number][] };
type CorridorProfile = { key: string; name: string; databaseName: string | null; trafficLevel: TrafficLevel; speedMps: number; road: Road | null };
type SimulatedDriver = { driverId: string; sessionId: string; profile: CorridorProfile; road: Road; cursor: number };
type State = { scenario: Scenario; startedAt: string; drivers: SimulatedDriver[]; corridors: CorridorProfile[]; timer: NodeJS.Timeout; ticking: boolean; reportId: string | null };

// Generated speeds deliberately produce the stated level in the real traffic aggregation.
const CORRIDOR_PROFILES: CorridorProfile[] = [
  { key: 'ayeduase', name: 'Ayeduase Road', databaseName: null, trafficLevel: 'moderate', speedMps: 9, road: AYEDUASE_SIMULATION_CORRIDOR.geometry },
  { key: 'osei-tutu', name: 'Osei Tutu II Boulevard', databaseName: 'Osei Tutu II Boulevard', trafficLevel: 'free', speedMps: 13, road: null },
  { key: 'eastern-bypass', name: 'Eastern Bypass', databaseName: 'Eastern Bypass', trafficLevel: 'free', speedMps: 12.5, road: null },
  { key: 'accra-road', name: 'Accra Road', databaseName: 'Accra Road', trafficLevel: 'moderate', speedMps: 9, road: null },
  { key: 'southern-bypass', name: 'Southern Bypass', databaseName: 'Southern Bypass', trafficLevel: 'heavy', speedMps: 5.5, road: null },
  { key: 'airport-roundabout', name: 'Airport Roundabout', databaseName: 'Airport Roundabout', trafficLevel: 'severe', speedMps: 2.5, road: null },
  { key: 'manhyia-road', name: 'Manhyia Road', databaseName: 'Manhyia Road', trafficLevel: 'heavy', speedMps: 5, road: null },
  { key: 'pv-obeng', name: 'P. V. Obeng Bypass', databaseName: 'P. V. Obeng Bypass', trafficLevel: 'free', speedMps: 12, road: null },
  { key: 'lake-road', name: 'Lake Road', databaseName: 'Lake Road', trafficLevel: 'moderate', speedMps: 8, road: null },
  { key: 'afia-kobi', name: 'Afia Kobi Ampem Avenue', databaseName: 'Afia Kobi Ampem Avenue', trafficLevel: 'heavy', speedMps: 4.5, road: null },
  { key: 'prempeh', name: 'Prempeh I Street', databaseName: 'Prempeh I Street', trafficLevel: 'severe', speedMps: 2, road: null },
];

let state: State | null = null;

async function clearSimulationData() {
  const driverIds = sql.join(SIMULATION_DRIVER_IDS.map((driverId) => sql`${driverId}::uuid`), sql`, `);
  await getDb().execute(sql`DELETE FROM incidents WHERE reporter_driver_id IN (${driverIds}) AND type = 'Simulated traffic incident'`);
  await getDb().execute(sql`DELETE FROM tracking_sessions WHERE driver_id IN (${driverIds})`);
}

async function findNamedRoad(name: string) {
  const result = await getDb().execute<{ geometry: Road | null }>(sql`
    SELECT ST_AsGeoJSON(ST_Transform(roads.way, 4326))::json AS geometry
    FROM planet_osm_roads AS roads
    WHERE roads.way IS NOT NULL AND roads.name ILIKE ${name}
      AND roads.highway IN ('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential')
      AND ST_Length(roads.way) > 120
    ORDER BY ST_Length(roads.way) DESC LIMIT 1
  `);
  const road = result.rows[0]?.geometry;
  if (!road?.coordinates || road.coordinates.length < 2) throw new Error(`${name} was not found in the imported OSM road data`);
  return road;
}

async function loadCorridors() {
  return Promise.all(CORRIDOR_PROFILES.map(async (profile) => ({ ...profile, road: profile.road ?? await findNamedRoad(profile.databaseName!) })));
}

async function emitPoints() {
  if (!state || state.ticking) return;
  state.ticking = true;
  try {
    const now = Date.now();
    // Limit simultaneous Valhalla trace requests while retaining ten distinct drivers per road.
    for (let offset = 0; offset < state.drivers.length; offset += 10) {
      await Promise.all(state.drivers.slice(offset, offset + 10).map(async (driver, driverIndex) => {
        const first = driver.road.coordinates[driver.cursor % driver.road.coordinates.length];
        driver.cursor = (driver.cursor + 1) % driver.road.coordinates.length;
        const second = driver.road.coordinates[driver.cursor % driver.road.coordinates.length];
        const speedMps = driver.profile.speedMps + (driverIndex % 3) * 0.08;
        const points: TrackingPointInput[] = [first, second].map(([longitude, latitude], pointIndex) => ({
          clientPointId: randomUUID(), latitude, longitude, speedMps, headingDegrees: 0, accuracyMeters: 5,
          recordedAt: new Date(now - (1 - pointIndex) * TICK_MS),
        }));
        await insertPoints(driver.driverId, driver.sessionId, points);
      }));
    }
  } catch (error) { console.error('Traffic simulation tick failed:', error); }
  finally { if (state) state.ticking = false; }
}

export function simulationStatus() {
  if (!state) return { running: false, scenario: null, startedAt: null, driverCount: 0, reportId: null, center: KUMASI, roads: [] };
  const activeSimulation = state;
  return {
    running: true, scenario: activeSimulation.scenario, startedAt: activeSimulation.startedAt, driverCount: activeSimulation.drivers.length, reportId: activeSimulation.reportId, center: KUMASI,
    corridorDriverCounts: Object.fromEntries(activeSimulation.corridors.map((profile) => [profile.key, DRIVERS_PER_CORRIDOR])),
    roads: activeSimulation.corridors.map((profile) => ({ name: profile.name, trafficLevel: profile.trafficLevel, speedKph: Math.round(profile.speedMps * 3.6), driverCount: DRIVERS_PER_CORRIDOR, coordinates: profile.road!.coordinates, hasIncident: activeSimulation.scenario === 'incident' && profile.trafficLevel === 'severe' })),
  };
}

export async function startSimulation(scenario: Scenario) {
  if (state) return simulationStatus();
  await clearSimulationData();
  const corridors = await loadCorridors();
  const sessions = await Promise.all(SIMULATION_DRIVER_IDS.map((driverId) => startOrGetActiveSession(driverId, new Date())));
  if (sessions.some((session) => !session)) throw new Error('Could not start all simulation tracking sessions');
  const report = await createIncident({ reporterDriverId: SIMULATION_DRIVER_IDS[0], type: 'Simulated traffic incident', description: `Presentation simulation: verified traffic conditions across ${corridors.length} Kumasi road corridors.`, severity: scenario === 'incident' ? 'high' : 'medium', roadName: 'Airport Roundabout', city: 'Kumasi', latitude: KUMASI.latitude, longitude: KUMASI.longitude });
  const drivers = SIMULATION_DRIVER_IDS.map((driverId, index) => {
    const profile = corridors[Math.floor(index / DRIVERS_PER_CORRIDOR)]; const road = profile.road!;
    return { driverId, sessionId: sessions[index]!.id, profile, road, cursor: (index * 3) % road.coordinates.length };
  });
  const timer = setInterval(() => { void emitPoints(); }, TICK_MS);
  state = { scenario, startedAt: new Date().toISOString(), drivers, corridors, timer, ticking: false, reportId: report?.id ?? null };
  await emitPoints();
  return simulationStatus();
}

export async function stopSimulation() {
  if (state) clearInterval(state.timer);
  state = null; await clearSimulationData(); return simulationStatus();
}
