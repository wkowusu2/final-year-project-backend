import { eq } from "drizzle-orm";
import { getDb } from "../configs/db.config.js";
import { drivers } from "../schema/driverProfiles.js";
import { Driver } from "../types/driver.js";
import { errorReturnDb, successReturnDb } from "../utils/db.utils.js";

const db = getDb();


export async function createDriverProfileDb(details: Driver) {
    try {
        const newDriver = await db.insert(drivers).values({id: details.userId ,fullName: details.fullName, phone: details.phone, email: details?.email}).returning({fullName: drivers.fullName, phone: drivers.phone, email: drivers.email})
        if(newDriver.length === 0) throw new Error('Failed to create driver');
        return successReturnDb(newDriver);
    } catch (error: any) {
        console.log('Error from createRiderProfile: ',error)
        return errorReturnDb(error);
    }
}

export async function getDriverProfileById(userId: string) {
    try {
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
        let hasProfile = true;
        const driver = await db.select({fullName: drivers.fullName, phone: drivers.phone, email: drivers.email}).from(drivers).where(eq(drivers.phone, phone));
        if(driver.length === 0){
            hasProfile = false
        }
        const obj = {
            ...driver,
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
        const now = new Date();
        await db.update(drivers).set({updatedAt: now, deleted: true}).where(eq(drivers.id, userId));
        return successReturnDb("Account deleted successfully")
    } catch (error: any) {
        console.log('Error from deleteUser: ',error)
        return errorReturnDb(error);
    }
}