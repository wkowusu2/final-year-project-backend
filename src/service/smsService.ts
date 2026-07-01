import { config } from "../configs/envImplement.js";
import { OtpSms } from "../types/auth.js";
import { errorReturnDb, successReturnDb } from "../utils/db.utils.js";

export async function sendSms(details: OtpSms) {
    try {
        const arkeselApiKey = config.arkesel.apiKey;
        const arkeselBaseUrl = config.arkesel.baseUrl;
        if(!arkeselApiKey) throw new Error('No arkesel api key found');
        if(!arkeselBaseUrl) throw new Error('No arkesel baseUrl found');

        const res = await fetch(`${arkeselBaseUrl}&api_key=${arkeselApiKey}&to=${details.phone}&from=MWV&sms=${details.otp}`)
        const resJson = await res.json();
        console.log('the res from arkesel is: ', resJson ?? res)

        return successReturnDb("Otp sent to phone");
    } catch (error: any) {
        console.log('Failed to send sms ', error);
        return errorReturnDb(error);
    }
}