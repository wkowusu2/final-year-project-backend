import { NextFunction, Request, Response } from 'express';

import { JwtPayloadType } from '../types/auth.js';

export function adminRoleChecker(_req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user as JwtPayloadType | undefined;

  if (user?.role === 'admin') {
    next();
    return;
  }

  return res.status(403).json({ success: false, data: null, error: 'Administrator access is required' });
}
