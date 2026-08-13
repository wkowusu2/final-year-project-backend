import { Request, Response } from 'express';

import { getProfileSummary } from '../../repository/profileSummary.js';

export async function getDriverRewards(_req: Request, res: Response) {
  try {
    const driverId = res.locals.user?.sub;
    if (typeof driverId !== 'string' || !driverId) return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
    const summary = await getProfileSummary(driverId);
    if (!summary) return res.status(404).json({ success: false, data: null, error: 'Driver profile does not exist' });
    const { metrics } = summary;
    const badges = [
      { id: 'distance-scout', name: 'Road Scout', description: 'Track 1,000 kilometres.', progress: Math.min(100, Math.round((metrics.distanceKm / 1000) * 100)), unlocked: metrics.distanceKm >= 1000 },
      { id: 'incident-guardian', name: 'Incident Guardian', description: 'Submit 15 useful incident reports.', progress: Math.min(100, Math.round((metrics.reportCount / 15) * 100)), unlocked: metrics.reportCount >= 15 },
      { id: 'trip-analyst', name: 'Journey Analyst', description: 'Complete 20 tracked journeys.', progress: Math.min(100, Math.round((metrics.tripCount / 20) * 100)), unlocked: metrics.tripCount >= 20 },
    ];
    return res.status(200).json({ success: true, data: { driver: summary.profile, metrics, badges }, error: null });
  } catch (error) {
    console.error('Unable to load rewards:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to load rewards' });
  }
}
