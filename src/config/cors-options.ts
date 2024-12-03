import cors from 'cors';

export const allowed_origins = [
  'http://localhost:3000',
  'http://localhost:5173'
];

export const public_cors = cors({
  origin: [allowed_origins[0]],
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export const admin_cors = cors({
  origin: [allowed_origins[1]],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});