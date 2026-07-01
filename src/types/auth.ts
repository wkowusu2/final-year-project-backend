import { InferInsertModel } from "drizzle-orm"
import { refreshToken } from "../schema/refreshTokens.js"
import { JwtPayload } from "jsonwebtoken";

export type JwtPayloadType = JwtPayload & {
    phone: string,
    role: string,
}

export type OtpToBeStored = {
    otp: string,
    phone: string
}

export type RefreshTokenDetails = {
    hashedRefreshToken: string,
    phone: string
}

export type User = {
    phone: string,
}

export type VerifyBody = {
    phone: string,
    otp: string,
    role: 'driver' | 'admin'
}

export type refreshTokenDetailType = InferInsertModel<typeof refreshToken>

export type OtpSms = {
    otp: string,
    phone: string,
}
