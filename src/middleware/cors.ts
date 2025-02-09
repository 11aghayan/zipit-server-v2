import { NextFunction, Request, Response } from 'express';

import { admin_cors, allowed_origins, public_cors } from '../config/cors-options';

const public_url_list =(process.env.PUBLIC_URL_LIST as string).split(",").map(url => url.trim());
const admin_url_list = (process.env.ADMIN_URL_LIST as string).split(",").map(url => url.trim());

export function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('origin') ?? "";
  if (admin_url_list.includes(origin)) {
    admin_cors(req, res, next);
  } else if (public_url_list.includes(origin)) {
    public_cors(req, res, next);
  } else {
    next();
  }
}

export function credentials(req: Request, res: Response, next: NextFunction) {
  const { origin } = req.headers;
  
  if (origin && allowed_origins.some(allowed_origin => allowed_origin.includes(origin))) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
}