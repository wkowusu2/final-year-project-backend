import { Request, Response } from 'express';
import { simulationStatus, startSimulation, stopSimulation } from '../../service/trafficSimulation.js';

export async function getSimulationStatus(_req: Request, res: Response) { return res.status(200).json({ success: true, data: simulationStatus(), error: null }); }
export async function postSimulationStart(req: Request, res: Response) {
  const scenario = req.body?.scenario;
  if (!['normal', 'rush_hour', 'incident'].includes(scenario)) return res.status(400).json({ success: false, data: null, error: 'Choose a valid simulation scenario' });
  try { return res.status(200).json({ success: true, data: await startSimulation(scenario), error: null }); }
  catch (error) { console.error('Unable to start simulation:', error); return res.status(500).json({ success: false, data: null, error: 'Unable to start KNUST traffic simulation' }); }
}
export async function postSimulationStop(_req: Request, res: Response) { try { return res.status(200).json({ success: true, data: await stopSimulation(), error: null }); } catch { return res.status(500).json({ success: false, data: null, error: 'Unable to stop traffic simulation' }); } }
