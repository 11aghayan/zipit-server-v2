import express from "express";

import { check_category_labels, check_if_category_empty, check_lang } from "../middleware/checks";
import { add_category, delete_category, edit_category, get_categories_and_item_qty, get_categories_full } from "../controllers/category-controllers";
import { verify_jwt } from "../middleware/verify-jwt";

const category_router = express.Router();

category_router.get(
  "/full",
  verify_jwt,
  get_categories_full
);

category_router.get(
  "/:lang", 
  check_lang, 
  get_categories_and_item_qty
);

category_router.post(
  "/",
  verify_jwt,
  check_category_labels,
  add_category
);

category_router.route("/:id")
  .put(verify_jwt, check_category_labels, edit_category)
  .delete(verify_jwt, check_if_category_empty, delete_category);

export default category_router;