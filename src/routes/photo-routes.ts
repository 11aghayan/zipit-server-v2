import express from "express";

import { get_photo } from "../controllers/photo-controllers";

const photo_router = express.Router();

photo_router.get(
  "/:id",
  get_photo
);

export default photo_router;