import { Request, Response } from 'express';

import { deleteIncidentImage, uploadIncidentImage } from '../../configs/cloudinary.js';
import { confirmIncident, createIncident, createIncidentMedia, getDriverIncidents, getIncidentDetail, getMapIncidents, IncidentStatusFilter } from '../../repository/incidents.js';

const severityValues = new Set(['low', 'medium', 'high', 'critical']);

export async function createDriverIncident(req: Request, res: Response) {
  try {
    const reporterDriverId = res.locals.user?.sub;
    if (typeof reporterDriverId !== 'string' || !reporterDriverId) {
      return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
    }

    const { type, description, severity, roadName, city } = req.body ?? {};
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);
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

    const uploadedImage = req.file ? await uploadIncidentImage(req.file.buffer) : null;
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
    if (!incident) {
      if (uploadedImage) await deleteIncidentImage(uploadedImage.publicId);
      throw new Error('Incident could not be created');
    }
    let media = null;
    try {
      media = req.file && uploadedImage ? await createIncidentMedia({
        incidentId: incident.id,
        storagePath: uploadedImage.secureUrl,
        cloudinaryPublicId: uploadedImage.publicId,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: uploadedImage.bytes,
      }) : null;
    } catch (error) {
      if (uploadedImage) await deleteIncidentImage(uploadedImage.publicId);
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: { ...incident, createdAt: new Date(incident.createdAt).toISOString(), media },
      error: null,
    });
  } catch (error) {
    console.error('Unable to create incident:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to create incident' });
  }
}

export async function getMyIncidents(req: Request, res: Response) {
  try {
    const driverId = res.locals.user?.sub;
    const status = req.query.status;
    if (typeof driverId !== 'string' || !driverId) {
      return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
    }
    if (status != null && (typeof status !== 'string' || !['pending', 'verified', 'resolved'].includes(status))) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid report status' });
    }

    const incidents = await getDriverIncidents(driverId, status as IncidentStatusFilter | undefined);
    return res.status(200).json({ success: true, data: { incidents }, error: null });
  } catch (error) {
    console.error('Unable to load driver incidents:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to load reports' });
  }
}

export async function getIncidentsForMap(req: Request, res: Response) {
  try {
    const keys = ['west', 'south', 'east', 'north'] as const;
    const bounds = Object.fromEntries(keys.map((key) => [key, Number(req.query[key])])) as Record<(typeof keys)[number], number>;
    if (!keys.every((key) => Number.isFinite(bounds[key])) || bounds.west >= bounds.east || bounds.south >= bounds.north || bounds.west < -180 || bounds.east > 180 || bounds.south < -90 || bounds.north > 90) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid map bounds' });
    }
    const incidents = await getMapIncidents(bounds);
    return res.status(200).json({ success: true, data: { incidents }, error: null });
  } catch (error) {
    console.error('Unable to load map incidents:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to load map incidents' });
  }
}

export async function getIncident(req: Request, res: Response) {
  try {
    const driverId = res.locals.user?.sub;
    const incidentId = req.params.incidentId;
    if (typeof driverId !== 'string' || !driverId || typeof incidentId !== 'string') {
      return res.status(400).json({ success: false, data: null, error: 'Invalid incident request' });
    }

    const incident = await getIncidentDetail(incidentId, driverId);
    if (!incident) return res.status(404).json({ success: false, data: null, error: 'Incident not found' });
    return res.status(200).json({ success: true, data: { incident }, error: null });
  } catch (error) {
    console.error('Unable to load incident:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to load incident details' });
  }
}

export async function confirmDriverIncident(req: Request, res: Response) {
  try {
    const driverId = res.locals.user?.sub;
    const incidentId = req.params.incidentId;
    if (typeof driverId !== 'string' || !driverId || typeof incidentId !== 'string') {
      return res.status(400).json({ success: false, data: null, error: 'Invalid incident request' });
    }

    const confirmation = await confirmIncident(incidentId, driverId);
    if (!confirmation) return res.status(404).json({ success: false, data: null, error: 'Incident not found' });
    return res.status(200).json({ success: true, data: confirmation, error: null });
  } catch (error) {
    console.error('Unable to confirm incident:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to confirm incident' });
  }
}
