import { Request, Response } from 'express';
import { completeSession, getActiveSession, insertPoints, startOrGetActiveSession, TrackingPointInput } from '../../repository/tracking.js';

const MAX_BATCH_SIZE = 100;

function requireDriverId(res: Response) {
    const driverId = res.locals.user?.sub;
    if (typeof driverId !== 'string' || !driverId) {
        throw new Error('User has no identity');
    }
    return driverId;
}

function parseOptionalDate(value: unknown, field: string) {
    if (value == null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new Error(`${field} must be an ISO timestamp`);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${field} must be an ISO timestamp`);
    }
    return date;
}

function parsePoint(value: unknown): TrackingPointInput {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Each point must be an object');
    }

    const point = value as Record<string, unknown>;
    const { clientPointId, latitude, longitude, speedMps, headingDegrees, accuracyMeters, recordedAt } = point;
    if (typeof clientPointId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientPointId)) {
        throw new Error('clientPointId must be a UUID');
    }
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new Error('latitude is invalid');
    }
    if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('longitude is invalid');
    }

    const parseOptionalMetric = (metric: unknown, field: string) => {
        if (metric == null) return null;
        if (typeof metric !== 'number' || !Number.isFinite(metric) || metric < 0) {
            throw new Error(`${field} is invalid`);
        }
        return metric;
    };

    const timestamp = parseOptionalDate(recordedAt, 'recordedAt');
    if (!timestamp) {
        throw new Error('recordedAt is required');
    }

    return {
        clientPointId,
        latitude,
        longitude,
        speedMps: parseOptionalMetric(speedMps, 'speedMps'),
        headingDegrees: parseOptionalMetric(headingDegrees, 'headingDegrees'),
        accuracyMeters: parseOptionalMetric(accuracyMeters, 'accuracyMeters'),
        recordedAt: timestamp,
    };
}

function isValidationError(error: unknown) {
    return error instanceof Error && (
        error.message.includes('must be') ||
        error.message.includes('is invalid') ||
        error.message.includes('is required') ||
        error.message === 'Each point must be an object'
    );
}

export async function startSession(req: Request, res: Response) {
    try {
        const driverId = requireDriverId(res);
        const startedAt = parseOptionalDate(req.body?.startedAt, 'startedAt');
        const session = await startOrGetActiveSession(driverId, startedAt);
        if (!session) {
            throw new Error('Unable to start tracking session');
        }
        return res.status(200).json({ success: true, data: { session }, error: null });
    } catch (error) {
        if (isValidationError(error)) {
            return res.status(400).json({ success: false, data: null, error: (error as Error).message });
        }
        console.error('Unable to start tracking session:', error);
        return res.status(500).json({ success: false, data: null, error: 'Unable to start tracking session' });
    }
}

export async function getActiveTrackingSession(req: Request, res: Response) {
    try {
        const driverId = requireDriverId(res);
        const session = await getActiveSession(driverId);
        return res.status(200).json({ success: true, data: { session }, error: null });
    } catch (error) {
        console.error('Unable to get active tracking session:', error);
        return res.status(500).json({ success: false, data: null, error: 'Unable to get active tracking session' });
    }
}

export async function addPoints(req: Request, res: Response) {
    try {
        const driverId = requireDriverId(res);
        const sessionId = req.params.sessionId;
        const points = req.body?.points;
        if (typeof sessionId !== 'string' || !Array.isArray(points) || points.length === 0 || points.length > MAX_BATCH_SIZE) {
            throw new Error('points must contain between 1 and 100 entries');
        }

        const parsedPoints = points.map(parsePoint);
        const result = await insertPoints(driverId, sessionId, parsedPoints);
        if (result.state === 'missing') {
            return res.status(404).json({ success: false, data: null, error: 'Tracking session not found' });
        }
        if (result.state === 'inactive') {
            return res.status(409).json({ success: false, data: null, error: 'Tracking session is not active' });
        }

        return res.status(200).json({
            success: true,
            data: {
                acceptedClientPointIds: result.acceptedClientPointIds,
                duplicateCount: parsedPoints.length - result.acceptedClientPointIds.length,
            },
            error: null,
        });
    } catch (error) {
        if (isValidationError(error)) {
            return res.status(400).json({ success: false, data: null, error: (error as Error).message });
        }
        console.error('Unable to store tracking points:', error);
        return res.status(500).json({ success: false, data: null, error: 'Unable to store tracking points' });
    }
}

export async function completeTrackingSession(req: Request, res: Response) {
    try {
        const driverId = requireDriverId(res);
        const sessionId = req.params.sessionId;
        if (typeof sessionId !== 'string') {
            throw new Error('Tracking session id is required');
        }

        const endedAt = parseOptionalDate(req.body?.endedAt, 'endedAt');
        const result = await completeSession(driverId, sessionId, endedAt);
        if (result.state === 'missing') {
            return res.status(404).json({ success: false, data: null, error: 'Tracking session not found' });
        }
        if (result.state === 'cancelled' || result.state === 'inactive') {
            return res.status(409).json({ success: false, data: null, error: 'Tracking session cannot be completed' });
        }

        return res.status(200).json({ success: true, data: { session: result.session }, error: null });
    } catch (error) {
        if (isValidationError(error)) {
            return res.status(400).json({ success: false, data: null, error: (error as Error).message });
        }
        console.error('Unable to complete tracking session:', error);
        return res.status(500).json({ success: false, data: null, error: 'Unable to complete tracking session' });
    }
}
