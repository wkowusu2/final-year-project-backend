import { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const now = new Date()
    console.log('Request came in at: ', now);
    console.log('Request method is: ', req.method);
    console.log('Request made to: ', req.url);
    console.log('Request body is: ', req.body);
    console.log('request header: ', req.headers);

    next();
}