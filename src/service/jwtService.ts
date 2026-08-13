import jwtPkg from 'jsonwebtoken'
import { generateRefreshToken } from '../utils/cryptoHelper.js';
import { saveRefreshToken } from '../repository/otp.js';
import { refreshTokenDetailType } from '../types/auth.js';
import { config } from '../configs/envImplement.js';
import { saveAdminRefreshToken } from '../repository/adminAuth.js';

const {sign} = jwtPkg;

export async function generateTokens(userId: string, phone: string, role: string): Promise<{_success: boolean, _error: string | null, _data?: {access_token: string, refresh_token: string }} >{
 try {
     if (!config.jwt.secret) {
      throw new Error("JWT_SECRET is not set");
    } 
    const secret = config.jwt.secret;
    const userDetails = {sub: userId, phone: phone, role: role};

    const access_expiry = 15 * 60 ;
    const access_token = sign(userDetails,secret, {expiresIn: access_expiry});

    const {actulToken, hashedToken} = generateRefreshToken();

   //  const refresh_expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const refreshTokenDetail: refreshTokenDetailType = { hashedRefreshToken: hashedToken, userId: userId}
    const response = await saveRefreshToken(refreshTokenDetail); 

    if(!response.success) throw new Error(response.error);

    const data = {access_token: access_token, refresh_token: actulToken};
    return {_success: true,_error: null, _data: data};
 } catch (error: any) {
    console.log("Error from creating tokens")
    return {_success: false, _error: error.message}
 }
}

export async function generateAdminTokens(adminId: string, email: string): Promise<{_success: boolean, _error: string | null, _data?: {access_token: string, refresh_token: string }}> {
 try {
    const accessToken = sign({ sub: adminId, email, role: 'admin' }, config.jwt.secret, { expiresIn: 15 * 60 });
    const { actulToken, hashedToken } = generateRefreshToken();
    await saveAdminRefreshToken(adminId, hashedToken);
    return { _success: true, _error: null, _data: { access_token: accessToken, refresh_token: actulToken } };
 } catch (error: any) {
    console.log('Error from creating admin tokens');
    return { _success: false, _error: error.message };
 }
}
