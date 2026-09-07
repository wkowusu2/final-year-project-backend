import { Request, Response } from 'express';

import { simulationStatus } from '../../service/trafficSimulation.js';

/**
 * Read-only view for driver devices. The simulator itself remains exclusively
 * under the administrator's control.
 */
export function getDriverSimulationStatus(_req: Request, res: Response) {
  return res.status(200).json({ success: true, data: simulationStatus(), error: null });
}
