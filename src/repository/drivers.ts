import { eq } from "drizzle-orm";
import { getDb } from "../configs/db.config.js";
import { drivers } from "../schema/driverProfiles.js";
import { Driver } from "../types/driver.js";
import { errorReturnDb, successReturnDb } from "../utils/db.utils.js";

export async function createDriverProfileDb(details: Driver) {
    try {
        const db = getDb();
        const newDriver = await db.insert(drivers).values({id: details.userId ,fullName: details.fullName, phone: details.phone, email: details?.email}).returning({fullName: drivers.fullName, phone: drivers.phone, email: drivers.email, doneOnBoarding: drivers.onboardingDone})
        if(newDriver.length === 0) throw new Error('Failed to create driver');
        return successReturnDb(newDriver[0]);
    } catch (error: any) {
        console.log('Error from createRiderProfile: ',error)
        return errorReturnDb(error);
    }
}

export async function getDriverProfileById(userId: string) {
    try {
        const db = getDb();
        const driver = await db.select({fullName: drivers.fullName, phone: drivers.phone, email: drivers.email}).from(drivers).where(eq(drivers.id, userId));
        if(driver.length === 0) throw new Error('Driver does not exist');

        return successReturnDb(driver[0])
    } catch (error: any) {
        console.log('Error from getDriverProfileById: ',error)
        return errorReturnDb(error);
    }
}

export async function getDriverProfileByPhone(phone: string) {
    try {
        const db = getDb();
        const driver = await db.select({fullName: drivers.fullName, phone: drivers.phone, email: drivers.email}).from(drivers).where(eq(drivers.phone, phone));
        if(driver.length === 0) throw new Error('Driver does not exist');

        return successReturnDb(driver[0])
    } catch (error: any) {
        console.log('Error from getDriverProfileById: ',error)
        return errorReturnDb(error);
    }
}

export async function hasDriverProfileDb(phone: string) {
    try {
        const db = getDb();
        let hasProfile = true;
        const driver = await db.select({fullName: drivers.fullName, phone: drivers.phone, email: drivers.email, isOnboardingDone: drivers.onboardingDone}).from(drivers).where(eq(drivers.phone, phone));
        if(driver.length === 0){
            hasProfile = false
        }
        let obj = {
            ...driver[0],
            hasDriverProfile: hasProfile
        }
        return successReturnDb(obj);
    } catch (error: any) {
        console.log('Error from hasDriverProfile: ',error)
        return errorReturnDb(error);
    }
}

export async function deleteDriver(userId: string) {
    try {
        const db = getDb();
        const now = new Date();
        await db.update(drivers).set({updatedAt: now, deleted: true}).where(eq(drivers.id, userId));
        return successReturnDb("Account deleted successfully")
    } catch (error: any) {
        console.log('Error from deleteUser: ',error)
        return errorReturnDb(error);
    }
}

export async function completeOnboarding(userId: string) {
    try {
        const db = getDb();
        const now = new Date();
        const onBoarding = await db.update(drivers).set({updatedAt: now, onboardingDone: true}).where(eq(drivers.id, userId)).returning({doneOnboarding: drivers.onboardingDone});
        return successReturnDb(onBoarding[0]);
    } catch (error: any) {
        console.log('Error from completeOnboarding: ',error)
        return errorReturnDb(error);
    }
}
