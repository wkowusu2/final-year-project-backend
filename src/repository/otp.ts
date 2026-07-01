import { and, eq } from "drizzle-orm";
import { getDb } from "../configs/db.config.js";
import { otps } from "../schema/otps.js";
import { OtpToBeStored, RefreshTokenDetails, User } from "../types/auth.js";
import { errorReturnDb, successReturnDb } from "../utils/db.utils.js";
import { refreshToken } from "../schema/refreshTokens.js";
import { users } from "../schema/users.js";
const db = getDb();

export async function saveOtp(details: OtpToBeStored) {
    try {
        const expiry = new Date();
        expiry.setTime(expiry.getTime() + 5 * 60 * 1000);
        await db.insert(otps).values({code: details.otp, phone: details.phone, expiresAt: expiry});
        return successReturnDb('Otp stored successfully');
    } catch (error: any) {
        console.log('Error from saveOtp: ',error)
        return errorReturnDb(error);
    }
}

export async function getOtp(phone: string, sentOtp: string) {
    try {
        const otp = await db.select({otp: otps.code, expiresAt: otps.expiresAt}).from(otps).where(and(eq(otps.phone, phone), eq(otps.code, sentOtp)));
        if(otp.length === 0) throw new Error('Otp does not exist');
        return successReturnDb(otp[0]);
    } catch (error: any) {
        console.log('Error from getOtp: ',error)
        return errorReturnDb(error);
    }
}

export async function deleteOtp(details: OtpToBeStored) {
    try {
        await db.delete(otps).where(and(eq(otps.code, details.otp), eq(otps.phone, details.phone)));
        return successReturnDb('otp deleted successfully');
    } catch (error: any) {
        console.log('Error from deleteOtp: ',error)
        return errorReturnDb(error);
    }
}

export async function saveRefreshToken(details: RefreshTokenDetails) {
    try {
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await db.insert(refreshToken).values({hashedRefreshToken: details.hashedRefreshToken, userId: details.userId, expiresAt: expiry});
        return successReturnDb('Otp stored successfully');
    } catch (error: any) {
        console.log('Error from saveRefreshToken: ',error)
        return errorReturnDb(error);
    }
}

export async function getRefreshtoken(userId: string, hashedToken: string) {
    try {
        const otp = await db.select({token: refreshToken.hashedRefreshToken, expiresAt: refreshToken.expiresAt}).from(refreshToken).where(and(eq(refreshToken.userId, userId), eq(refreshToken.hashedRefreshToken, hashedToken)));
        if(otp.length === 0) throw new Error('Token does not exist');
        return successReturnDb(otp[0]);
    } catch (error: any) {
        console.log('Error from getRefreshtoken: ',error)
        return errorReturnDb(error);
    }
}

export async function revokeRefreshToken(userId: string) {
    try {
        const now = new Date()
        await db.update(refreshToken).set({revoked: true, revokedAt: now}).where(eq(refreshToken.userId, userId));
        return successReturnDb('Revoke successful')
    } catch (error: any) {
        console.log('Error from revokeRefreshToken: ',error)
        return errorReturnDb(error);
    }
}

export async function deleteRefreshToken(userId: string, token: string) {
    try {
        await db.delete(refreshToken).where(and(eq(refreshToken.userId, userId), eq(refreshToken.hashedRefreshToken, token)));
        return successReturnDb('Revoke successful')
    } catch (error: any) {
        console.log('Error from revokeRefreshToken: ',error)
        return errorReturnDb(error);
    }
}
export async function createUser(phone: string) {
    try {
        const user = await db.insert(users).values({phone: phone}).returning({phone: users.phone, userId: users.id, role: users.role});
        if(user.length === 0) throw new Error('Failed to save user');
        return successReturnDb(user[0]);
    } catch (error: any) {
        console.log('Error from createUser: ',error)
        return errorReturnDb(error);
    }
}

export async function getUser(userId: string) {
    try {
        const user = await db.select({phone: users.phone, role: users.role}).from(users).where(eq(users.id, userId));
        if(user.length === 0) throw new Error('User does not exist');
        return successReturnDb(user[0]);
    } catch (error: any) {
        console.log('Error from getUser: ',error)
        return errorReturnDb(error);
    }
}

export async function getUserByPhone(phone: string) {
    try {
        const user = await db.select({phone: users.phone, userId: users.id, role: users.role}).from(users).where(eq(users.phone, phone));
        if(user.length === 0) {
            return successReturnDb('');
        }
        return successReturnDb(user[0]);
    } catch (error: any) {
        console.log('Error from getUser: ',error)
        return errorReturnDb(error);
    }
}
