import * as crypto from "crypto";

export function generateRefreshToken(){
    const token = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = crypto.createHash('sha256').update(token).digest('hex');
    return {actulToken: token, hashedToken: hashedRefreshToken};
}

export function hashToken(token: string){
    const hashedRefreshToken = crypto.createHash('sha256').update(token).digest('hex');
    return hashedRefreshToken;
}