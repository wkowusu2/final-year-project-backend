import { Request, Response } from 'express';

import { getAdminDashboard, updateAdminIncidentStatus } from '../../repository/adminDashboard.js';

const DEFAULT_WINDOW_MINUTES = 30;
const MAX_WINDOW_MINUTES = 24 * 60;

export async function getDashboard(req: Request, res: Response) {
  const requestedWindow = req.query.windowMinutes;
  const windowMinutes = requestedWindow == null ? DEFAULT_WINDOW_MINUTES : Number(requestedWindow);

  if (!Number.isInteger(windowMinutes) || windowMinutes < 5 || windowMinutes > MAX_WINDOW_MINUTES) {
    return res.status(400).json({ success: false, data: null, error: 'windowMinutes must be an integer between 5 and 1440' });
  }

  try {
    const dashboard = await getAdminDashboard(windowMinutes);
    return res.status(200).json({ success: true, data: dashboard, error: null });
  } catch (error) {
    console.error('Unable to load admin dashboard:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to load admin dashboard' });
  }
}

export async function updateIncidentStatus(req: Request, res: Response) {
  const incidentId = req.params.incidentId;
  const status = req.body?.status;
  if (typeof incidentId !== 'string' || !['verified', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, data: null, error: 'Status must be verified or resolved' });
  }
  try {
    const incident = await updateAdminIncidentStatus(incidentId, status);
    if (!incident) return res.status(404).json({ success: false, data: null, error: 'Incident not found' });
    return res.status(200).json({ success: true, data: { incident }, error: null });
  } catch (error) {
    console.error('Unable to update incident status:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to update incident status' });
  }
}
