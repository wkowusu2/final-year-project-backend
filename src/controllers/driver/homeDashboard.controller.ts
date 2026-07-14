import { Request, Response } from 'express';

import { getHomeDashboard } from '../../repository/homeDashboard.js';

export async function getDriverHomeDashboard(_req: Request, res: Response) {
  try {
    const driverId = res.locals.user?.sub;
    if (typeof driverId !== 'string' || !driverId) {
      return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
    }

    const dashboard = await getHomeDashboard(driverId);
    if (!dashboard) {
      return res.status(404).json({ success: false, data: null, error: 'Driver profile does not exist' });
    }

    return res.status(200).json({ success: true, data: dashboard, error: null });
  } catch (error) {
    console.error('Unable to load driver home dashboard:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to load home dashboard' });
  }
}
