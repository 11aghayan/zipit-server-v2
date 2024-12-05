import express from "express";

import { check_category_labels, check_lang } from "../middleware/checks";
import { add_category, delete_category, edit_category, get_categories_public, get_categories_admin } from "../controllers/category-controllers";
import { verify_jwt } from "../middleware/verify-jwt";

const category_router = express.Router();

category_router.get(
  "/admin",
  verify_jwt,
  get_categories_admin
);

category_router.get(
  "/public", 
  check_lang, 
  get_categories_public
);

category_router.post(
  "/",
  verify_jwt,
  check_category_labels,
  add_category
);

category_router.route("/:id")
  .put(verify_jwt, check_category_labels, edit_category)
  .delete(verify_jwt, delete_category);

export default category_router;