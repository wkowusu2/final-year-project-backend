import { Request, Response } from "express";
import { Driver } from "../../types/driver.js";
import { completeOnboarding, createDriverProfileDb, getDriverProfileById } from "../../repository/drivers.js";
import { getProfileSummary } from '../../repository/profileSummary.js';

export async function createDriverProfile(req: Request, res: Response) {
    try {
        const {sub} = res.locals.user;
        if(!sub) throw new Error('User has no identity');

        const details: Driver = req.body;

        if(!details || !details.fullName || !details.phone) throw new Error('Missing Details');
        if(typeof details.fullName !== 'string') throw new Error('Wrong data format');
        if(typeof details.phone !== 'string') throw new Error('Wrong data format');

        details.userId = sub;

        const {success, error, data} = await createDriverProfileDb(details);
        if(!success) throw new Error(error);

        return res.status(201).json({success: true, data: data, error: null})
    } catch (error: any) {
        console.log("Error occurred at createDriverProfile: ", error);
        return res.status(400).json({success: false, error: error, data: null})
    }
}

export async function getDriverProfileWithId(req: Request, res: Response) {
    try {
        const {sub} = res.locals.user;
        if(!sub) throw new Error('User has no identity');

        const {success, data, error} = await getDriverProfileById(sub);
        if(!success) throw new Error(error);

        return res.status(200).json({success: true, error: null, data: data})
    } catch (error: any) {
        console.log("Error occurred at getDriverProfile: ", error);
        return res.status(400).json({success: false, error: error, data: null})
    }
}

export async function doneOnBoarding(req: Request, res: Response) {
    try {
        const {sub} = res.locals.user;
        if(!sub) throw new Error('User has no identity');

        const {success, data, error} = await completeOnboarding(sub);
        if(!success) throw new Error(error);

        return res.status(200).json({success: true, error: null, data: data})
    } catch (error: any) {
        console.log("Error occurred at getDriverProfile: ", error);
        return res.status(400).json({success: false, error: error, data: null})
    }
}

export async function getDriverProfileSummary(_req: Request, res: Response) {
    try {
        const driverId = res.locals.user?.sub;
        if (typeof driverId !== 'string' || !driverId) return res.status(401).json({ success: false, data: null, error: 'User has no identity' });
        const summary = await getProfileSummary(driverId);
        if (!summary) return res.status(404).json({ success: false, data: null, error: 'Driver profile does not exist' });
        return res.status(200).json({ success: true, data: summary, error: null });
    } catch (error) {
        console.error('Unable to load profile summary:', error);
        return res.status(500).json({ success: false, data: null, error: 'Unable to load profile summary' });
    }
}
