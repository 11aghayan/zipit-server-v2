import express from "express";

import { filter_items, get_suggestion_sorting, get_user_sorting } from "../middleware/sorting";
import { add_item, delete_item, edit_item, get_all_items_admin, get_all_items_public, get_cart_items, get_item_admin, get_item_public, get_similar_items } from "../controllers/item-controllers";
import { verify_jwt } from "../middleware/credentials";
import { check_cart_items_body, check_item_body, check_lang } from "../middleware/checks";
import { convert_photos_to_webp } from "../middleware/photo-actions";

const item_router = express.Router();

item_router.get(
  "/public/all",
  check_lang,
  filter_items,
  get_user_sorting,
  get_all_items_public
);

item_router.get(
  "/item/public/:id",
  check_lang,
  get_item_public
);

item_router.get(
  "/public/suggestions",
  check_lang,
  get_suggestion_sorting,
  get_all_items_public
);

item_router.get(
  "/public/similar",
  check_lang,
  get_similar_items
);

item_router.post(
  "/public/cart",
  check_lang,
  check_cart_items_body,
  get_cart_items
);

item_router.get(
  "/admin/all",
  verify_jwt,
  filter_items,
  get_user_sorting,
  get_all_items_admin
);

item_router.post(
  "/item/admin",
  verify_jwt,
  check_item_body,
  convert_photos_to_webp,
  add_item
);

item_router.route("/item/admin/:id")
  .get(verify_jwt, get_item_admin)
  .put(verify_jwt, check_item_body, convert_photos_to_webp, edit_item)
  .delete(verify_jwt, delete_item);

export default item_router;