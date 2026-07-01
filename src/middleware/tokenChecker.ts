import jwtPkg from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express"
import { JwtPayloadType } from '../types/auth.js';
import { config } from '../configs/envImplement.js';

const {verify} = jwtPkg;


export async function tokenCheck(req: Request, res: Response<{}, {user: JwtPayloadType}>, next: NextFunction) {
    try {

    if(!config.jwt.secret){
        throw new Error("Jwt secret not found")
    }
    const secret = config.jwt.secret; 
    const header = req.headers.authorization
    if(!header) {
        return res.status(401).json({success: false, error: "Header not found in request"});
    }
    const [type, token] = header.split(" ");
    if(type != "Bearer" || !token) {
        return res.status(401).json("No token found")
    }
    const decodedToken  = verify(token, secret);
    if(typeof decodedToken === 'string'){
        throw new Error("Invalid token payload"); 
    }
    console.log("decoded token is : ", decodedToken)
    const now = Math.floor(Date.now()/1000);

    if(decodedToken.exp && decodedToken.exp < now){
        return res.status(401).json({success: false, error: "Token is expired"})
    }
    res.locals.user = decodedToken as JwtPayloadType;

    next();
    
    } catch (error: any) {
        console.log("Error from verfying token: ", error)
        return res.status(401).json({success: false, error: error.message})
    }
}