export function generateOtp(){
    let otp = ''; 

    for(let i = 0; i <= 5; i++){
        let number = Math.floor(Math.random() * 10);
        otp+= number
    }
    return otp;
}