import { NextFunction, Request, Response } from "express";
import { JwtPayloadType } from "../types/auth.js";

export function driverRoleChecker(req: Request, res: Response, next: NextFunction) {
    try {
        console.log("Res.locals.user",res.locals.user);
        const user: JwtPayloadType = res.locals.user;
        if(user.role.trim() !== 'driver' ){
        throw new Error('You are not allowed to perform this action');
        }
        next();
    } catch (error: any) {
        console.log("You are not allowed to take this action");
        return res.status(401).json({success: false, data: null, error: error.message})
    }
}