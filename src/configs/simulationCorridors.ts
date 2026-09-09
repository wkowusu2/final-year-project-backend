/**
 * Verified OSM presentation corridors whose ways are absent from the current
 * PostGIS import. Coordinates are a simplified trace of OSM way 173059689
 * (Ayeduase Road), retained so the simulator uses the genuine road rather than
 * a visually similar nearby segment.
 */
export const AYEDUASE_SIMULATION_CORRIDOR = {
  osmId: '173059689',
  name: 'Ayeduase Road',
  center: { latitude: 6.6758, longitude: -1.5609 },
  geometry: {
    type: 'LineString' as const,
    coordinates: [
      [-1.5486896, 6.6744280], [-1.5499614, 6.6745723],
      [-1.5515804, 6.6749992], [-1.5530356, 6.6753967],
      [-1.5541498, 6.6756182], [-1.5551127, 6.6759594],
      [-1.5563562, 6.6762681], [-1.5576258, 6.6761128],
      [-1.5588888, 6.6759553], [-1.5600896, 6.6759984],
      [-1.5613955, 6.6758923], [-1.5625273, 6.6757722],
      [-1.5636551, 6.6756649],
    ] as [number, number][],
  },
} as const;

export function simulationCorridorName(osmId: string) {
  return osmId === AYEDUASE_SIMULATION_CORRIDOR.osmId ? AYEDUASE_SIMULATION_CORRIDOR.name : null;
}
