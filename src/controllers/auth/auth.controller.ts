import { Request, Response } from "express";
import { generateOtp } from "../../service/otpService.js";
import { createUser, deleteOtp, getOtp, getUserByPhone, saveOtp } from "../../repository/otp.js";
import { OtpToBeStored, VerifyBody } from "../../types/auth.js";
import { hasDriverProfileDb } from "../../repository/drivers.js";
import { generateTokens } from "../../service/jwtService.js";
// import { sendSms } from "../../service/smsService.js";

export async function sendOtp(req: Request, res: Response) {
    try {
        const { phone } = req.body;
        if(!phone) throw new Error('No phone number was provided');

        //generate the otp
        const otp = generateOtp();
        //store the otp
        const obj: OtpToBeStored = {
            otp: otp,
            phone: phone
        }
        const saveOtpRes = await saveOtp(obj);
        if(!saveOtpRes.success) throw new Error(saveOtpRes.error);
        //TODO: send the otp
        // const { error, success } = await sendSms({otp: otp, phone: phone});
        // if(!success){
        //     console.log('Failed to send sms with the error: ', error)
        // }
        //send the response
        return res.status(200).json({success: true, data: "Otp sent", error: null})
    } catch (error: any) {
        console.log('Some error occurred at sendOtp: ', error);
        return res.status(400).json({success: false, error: error, data: null})
    }
}

export async function verifyOtp(req: Request, res: Response) {
    try {
        const verifyBody: VerifyBody = req.body;
        if(!verifyBody || !verifyBody.otp || !verifyBody.phone || !verifyBody.role ) throw new Error('Missing details');

        //get the otp
        const otpRes = await getOtp(verifyBody.phone, verifyBody.otp);
        if(!otpRes.success) throw new Error(otpRes.error);
        //validate otp expiration
        const now = new Date()
        if(otpRes.data.expiresAt < now){
            const otpDetails: OtpToBeStored = {
                otp: otpRes.data.otp,
                phone: verifyBody.phone
            }
            const delOtpRes = await deleteOtp(otpDetails);
            if(!delOtpRes.success){
                console.log('Failed to deleted otp')
            }
            return res.status(400).json({success: false, data: null, error: "Otp has expired"})
        }
        await deleteOtp({otp: verifyBody.otp, phone: verifyBody.phone });
        //check if there's account else create user;
        let user;
        const userPresent = await getUserByPhone(verifyBody.phone);
        if(!userPresent.success) throw new Error(userPresent.error);

        if(userPresent.data === ''){
            const createdUser = await createUser(verifyBody.phone);
            if(!createdUser.success) throw new Error(createdUser.error);
            user = createdUser.data
        }
        else {
            user = userPresent.data
        }

        let hasProfile: boolean = false;
        let fullName: string | null = null ;
        let doneOnBoarding: boolean = false;
        if(verifyBody.role === 'driver'){
            const hasProfileDetails = await hasDriverProfileDb(verifyBody.phone);
            if(!hasProfileDetails.success) throw new Error(hasProfileDetails.error);
            if(hasProfileDetails.data.hasDriverProfile === true){
                console.log('the profile data is: ',hasProfileDetails.data)
                hasProfile = true
                fullName = hasProfileDetails.data.fullName
                doneOnBoarding = hasProfileDetails.data.isOnboardingDone
            }
        }
        
        //generate tokens
        const { _error, _success, _data } = await generateTokens(user.userId, user.phone, user.role);
        if(!_success) throw new Error(_error!)
        //send details
        const returnObj = {
            hasProfile,
            accessToken: _data?.access_token,
            refreshToke: _data?.refresh_token,
            fullName: fullName,
            doneOnBoarding: doneOnBoarding
        }
        return res.status(200).json({success: true, error: null, data: returnObj})
    } catch (error: any) {
        console.log('Some error occurred at verifyOtp: ', error);
        return res.status(400).json({success: false, error: error, data: null})
    }
}