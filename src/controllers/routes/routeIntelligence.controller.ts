import { Request, Response } from 'express';
import { config } from '../../configs/envImplement.js';
import { getRouteAdvisories, getRouteIncidents, getRouteTraffic, RouteGeometry } from '../../repository/routeIntelligence.js';

type ValhallaTrip = { summary: { time: number; length: number }; legs: { shape: string }[] };
type ValhallaResponse = { trip?: ValhallaTrip; alternates?: { trip: ValhallaTrip }[]; error?: string };

function coordinate(value: unknown, name: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be a number`);
  return number;
}

function trafficLevel(speed: number | null) {
  if (speed == null) return 'unknown';
  if (speed < 12) return 'severe';
  if (speed < 25) return 'heavy';
  if (speed < 40) return 'moderate';
  return 'free';
}

/** Valhalla's default route shape is a precision-6 encoded polyline. */
function decodeValhallaShape(shape: string): RouteGeometry {
  const coordinates: [number, number][] = [];
  let latitude = 0;
  let longitude = 0;
  let index = 0;
  const decodeValue = () => {
    let value = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = shape.charCodeAt(index++) - 63;
      value |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < shape.length);
    return value & 1 ? ~(value >> 1) : value >> 1;
  };
  while (index < shape.length) {
    latitude += decodeValue();
    longitude += decodeValue();
    coordinates.push([longitude / 1_000_000, latitude / 1_000_000]);
  }
  if (coordinates.length < 2) throw new Error('Valhalla returned an invalid route shape');
  return { type: 'LineString', coordinates };
}

function decodeValhallaTrip(trip: ValhallaTrip): RouteGeometry {
  const coordinates = trip.legs.flatMap((leg, index) => {
    const segment = decodeValhallaShape(leg.shape).coordinates;
    return index === 0 ? segment : segment.slice(1);
  });
  if (coordinates.length < 2) throw new Error('Valhalla returned an invalid route shape');
  return { type: 'LineString', coordinates };
}

export async function getRouteIntelligence(req: Request, res: Response) {
  try {
    const originLat = coordinate(req.query.originLat, 'originLat');
    const originLng = coordinate(req.query.originLng, 'originLng');
    const destinationLat = coordinate(req.query.destinationLat, 'destinationLat');
    const destinationLng = coordinate(req.query.destinationLng, 'destinationLng');
    if (Math.abs(originLat) > 90 || Math.abs(destinationLat) > 90 || Math.abs(originLng) > 180 || Math.abs(destinationLng) > 180) throw new Error('Coordinates are outside geographic bounds');

    const url = new URL('/route', config.routing.valhallaBaseUrl);
    url.searchParams.set('json', JSON.stringify({
      locations: [{ lat: originLat, lon: originLng }, { lat: destinationLat, lon: destinationLng }],
      costing: 'auto',
      alternates: 2,
      units: 'kilometers',
    }));
    const routeResponse = await fetch(url);
    const routed = await routeResponse.json() as ValhallaResponse;
    const valhallaRoutes = routed.trip ? [routed.trip, ...(routed.alternates ?? []).map((alternate) => alternate.trip)] : [];
    if (!routeResponse.ok || !valhallaRoutes.length) throw new Error(routed.error ?? 'Routing service did not return a route');

    const routes = await Promise.all(valhallaRoutes.slice(0, 3).map(async (route, index) => {
      const geometry = decodeValhallaTrip(route);
      const [traffic, incidents, advisories] = await Promise.all([
        getRouteTraffic(geometry),
        getRouteIncidents(geometry),
        getRouteAdvisories(geometry),
      ]);
      const speedMultiplier = traffic.medianSpeedKph == null ? 1 : Math.min(3, Math.max(0.85, 45 / Math.max(traffic.medianSpeedKph, 10)));
      const incidentPenaltySeconds = incidents.length * 120;
      const advisoryPenaltySeconds = advisories.reduce((total, advisory) => total + (
        advisory.type === 'road_closure' ? 600 : advisory.impact === 'high' ? 300 : 120
      ), 0);
      const baseDurationSeconds = Math.round(route.summary.time);
      const estimatedDurationSeconds = Math.round(baseDurationSeconds * speedMultiplier + incidentPenaltySeconds + advisoryPenaltySeconds);
      return {
        id: `route-${index + 1}`,
        geometry,
        distanceMeters: Math.round(route.summary.length * 1000),
        baseDurationSeconds,
        estimatedDurationSeconds,
        trafficLevel: trafficLevel(traffic.medianSpeedKph),
        medianSpeedKph: traffic.medianSpeedKph,
        trafficSampleCount: traffic.sampleCount,
        matchedRoadCount: traffic.matchedRoadCount,
        incidents,
        advisories,
      };
    }));
    routes.sort((a, b) => a.estimatedDurationSeconds - b.estimatedDurationSeconds);
    return res.status(200).json({ success: true, data: { routes, generatedAt: new Date().toISOString() }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to calculate routes';
    if (message.includes('must be a number') || message.includes('outside geographic')) return res.status(400).json({ success: false, data: null, error: message });
    console.error('Unable to calculate route intelligence:', error);
    return res.status(502).json({ success: false, data: null, error: 'Unable to calculate route intelligence right now' });
  }
}
