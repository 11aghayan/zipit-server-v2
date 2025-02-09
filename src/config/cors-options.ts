import cors from 'cors';

export const allowed_origins = [
  (process.env.PUBLIC_URL_LIST as string).split(",").map(url => url.trim()),
  (process.env.ADMIN_URL_LIST as string).split(",").map(url => url.trim())
];

export const public_cors = cors({
  origin: allowed_origins[0],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export const admin_cors = cors({
  origin: allowed_origins[1],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});