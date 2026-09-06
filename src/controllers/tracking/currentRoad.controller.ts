import { Request, Response } from 'express';
import { getCurrentRoadCondition } from '../../repository/currentRoad.js';

export async function getCurrentRoad(req: Request, res: Response) {
  const driverId = res.locals.user?.sub;
  if (typeof driverId !== 'string') return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
  try { return res.status(200).json({ success: true, data: { road: await getCurrentRoadCondition(driverId) }, error: null }); }
  catch (error) { console.error('Unable to load current road condition:', error); return res.status(500).json({ success: false, data: null, error: 'Unable to load current road condition' }); }
}
