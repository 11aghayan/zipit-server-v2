import { rateLimit } from "express-rate-limit";

export const rate_limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 5 minutes
	limit: 35, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7',
	legacyHeaders: false
});