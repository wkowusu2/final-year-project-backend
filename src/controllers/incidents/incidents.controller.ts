import { Request, Response } from 'express';

import { createIncident } from '../../repository/incidents.js';

const severityValues = new Set(['low', 'medium', 'high', 'critical']);

export async function createDriverIncident(req: Request, res: Response) {
  try {
    const reporterDriverId = res.locals.user?.sub;
    if (typeof reporterDriverId !== 'string' || !reporterDriverId) {
      return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
    }

    const { type, description, severity, roadName, city, latitude, longitude } = req.body ?? {};
    if (
      typeof type !== 'string' || !type.trim() ||
      typeof description !== 'string' || !description.trim() ||
      typeof severity !== 'string' || !severityValues.has(severity) ||
      typeof roadName !== 'string' || !roadName.trim() ||
      typeof city !== 'string' || !city.trim() ||
      typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid incident details' });
    }

    const incident = await createIncident({
      reporterDriverId,
      type: type.trim(),
      description: description.trim(),
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      roadName: roadName.trim(),
      city: city.trim(),
      latitude,
      longitude,
    });
    if (!incident) throw new Error('Incident could not be created');

    return res.status(201).json({
      success: true,
      data: { ...incident, createdAt: incident.createdAt.toISOString() },
      error: null,
    });
  } catch (error) {
    console.error('Unable to create incident:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to create incident' });
  }
}
