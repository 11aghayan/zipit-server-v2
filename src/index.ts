import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import { cors, credentials } from "./middleware/cors";
import item_router from "./routes/item-routes";
import photo_router from "./routes/photo-routes";
import category_router from "./routes/category-routes";
import auth_router from "./routes/auth-routes";
import route_not_found from "./controllers/not-found-controller";
import order_router from "./routes/order-routes";
import backup_router from "./routes/backup-routes";

export const app = express();
export const BASE_URL = '/api/v2';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(credentials);
app.use(cors);

// Routes
app.use(`${BASE_URL}/order`, order_router);
app.use(`${BASE_URL}/items`, item_router);
app.use(`${BASE_URL}/photo`, photo_router);
app.use(`${BASE_URL}/categories`, category_router);
app.use(`${BASE_URL}/backup`, backup_router);
app.use(`${BASE_URL}/auth`, auth_router);
app.use(route_not_found);


const PORT = process.env.PORT || 3200;
export const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
  });
});