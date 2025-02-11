import express from "express";

import { verify_jwt } from "../middleware/credentials";
import { backup_db } from "../controllers/backup-controllers";

const backup_router = express.Router();

backup_router.get(
  "/",
  verify_jwt,
  backup_db
);

export default backup_router;