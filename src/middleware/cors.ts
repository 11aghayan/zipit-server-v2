import { NextFunction, Request, Response } from 'express';

import { admin_cors, allowed_origins, public_cors } from '../config/cors-options';

export function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('origin');
  if (origin === process.env.ADMIN_URL as string) {
    admin_cors(req, res, next);
  } else if (origin === process.env.PUBLIC_URL as string) {
    public_cors(req, res, next);
  } else {
    next();
  }
}

export function credentials(req: Request, res: Response, next: NextFunction) {
  const { origin } = req.headers;
  
  if (origin && allowed_origins.includes(origin)) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
}