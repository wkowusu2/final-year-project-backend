import { config } from "../configs/envImplement.js";
import { OtpSms } from "../types/auth.js";
import { errorReturnDb, successReturnDb } from "../utils/db.utils.js";

export async function sendSms(details: OtpSms) {
    try {
        const arkeselApiKey = config.arkesel.apiKey;
        const arkeselBaseUrl = config.arkesel.baseUrl;
        const phoneNumberWithoutZero = details.phone.slice(1);
        const phone = '+233'+phoneNumberWithoutZero
        console.log(`phone is: ${phone}`)
        if(!arkeselApiKey) throw new Error('No arkesel api key found');
        if(!arkeselBaseUrl) throw new Error('No arkesel baseUrl found');

        const data = {
            sender: 'RoadPulse',
            message: `Your otp is ${details.otp}`,
            recipients: [`${phone}`]
        }
        const res = await fetch(`${arkeselBaseUrl}`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${arkeselApiKey}`,
                'api-key': `${arkeselApiKey}`
            },
            body: JSON.stringify(data)
        })
        const resJson = await res.json();
        console.log('the res from arkesel is: ', resJson ?? res)

        return successReturnDb("Otp sent to phone");
    } catch (error: any) {
        console.log('Failed to send sms ', error);
        return errorReturnDb(error);
    }
}