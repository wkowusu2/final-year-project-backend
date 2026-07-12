import { Request, Response } from 'express';
import { getRoadsInViewport } from '../../repository/roads.js';

const MAX_VIEWPORT_SPAN = 0.25;

function parseBound(value: unknown, name: string) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${name} must be a number`);
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`${name} must be a number`);
    }

    return parsed;
}

export async function getRoads(req: Request, res: Response) {
    try {
        const west = parseBound(req.query.west, 'west');
        const south = parseBound(req.query.south, 'south');
        const east = parseBound(req.query.east, 'east');
        const north = parseBound(req.query.north, 'north');

        if (west < -180 || east > 180 || south < -90 || north > 90) {
            throw new Error('Viewport is outside geographic bounds');
        }

        if (west >= east || south >= north) {
            throw new Error('Viewport bounds are invalid');
        }

        if (east - west > MAX_VIEWPORT_SPAN || north - south > MAX_VIEWPORT_SPAN) {
            throw new Error('Viewport is too large');
        }

        const viewport = { west, south, east, north };
        console.log('Received road viewport request:', viewport);

        const result = await getRoadsInViewport(west, south, east, north);
        if (!result.success) {
            throw result.error;
        }

        console.log('Returning roads for viewport:', {
            viewport,
            featureCount: result.data.features.length,
            truncated: result.data.truncated,
        });
        return res.status(200).json({ success: true, data: result.data, error: null });
    } catch (error: any) {
        if (error instanceof Error && (
            error.message.includes('must be a number') ||
            error.message.includes('Viewport')
        )) {
            return res.status(400).json({ success: false, data: null, error: error.message });
        }

        console.error('Error from getRoads:', error);
        return res.status(500).json({ success: false, data: null, error: 'Unable to load roads' });
    }
}
