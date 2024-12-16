import express from "express";

import { get_photo } from "../controllers/photo-controllers";
import { check_photo_sizes } from "../middleware/checks";
import { get_photo_from_db, resize_image } from "../middleware/photo-actions";
import { get_photo_src_index } from "../middleware/sorting";

const photo_router = express.Router();

photo_router.get(
  "/:id",
  check_photo_sizes,
  get_photo_src_index,
  get_photo_from_db,
  resize_image,
  get_photo
);

export default photo_router;