import express from "express";

import { modify_photo_size } from "../middleware/convert-photos";
import { get_photo } from "../controllers/photo-controllers";
import { find_photo } from "../middleware/find-photos";

const photo_router = express.Router();

photo_router.get(
  "/:id",
  find_photo,
  modify_photo_size,
  get_photo
);

export default photo_router;