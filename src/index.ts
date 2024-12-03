import "dotenv/config";
import express from 'express';
import cookieParser from 'cookie-parser';

import { error_logger } from "./util/error_logger";

const app = express();
const BASE_URL = '/api/v2';

// Middleware
app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());
// app.use(credentials);
// app.use(cors);

function start_server() {
  const PORT = process.env.PORT || 3200;
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    error_logger("start_server", error);
  }
}

start_server();