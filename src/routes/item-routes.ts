import express from "express";

import { get_similar_sorting, get_suggestion_sorting, get_user_sorting } from "../middleware/sorting";
import { get_all_items_admin, get_all_items_public, get_item_admin, get_item_public } from "../controllers/item-controllers";
import { verify_jwt } from "../middleware/verify-jwt";

const item_router = express.Router();

item_router.get(
  "/public/all",
  get_user_sorting,
  get_all_items_public
);

item_router.get(
  "/item/public/:id",
  get_item_public
);

item_router.get(
  "/public/suggestions",
  get_suggestion_sorting,
  get_all_items_public
);

item_router.get(
  "/public/similar",
  get_similar_sorting,
  get_all_items_public
);

item_router.get(
  "/admin/all",
  verify_jwt,
  get_user_sorting,
  get_all_items_admin
);

item_router.get(
  "/item/admin/:id",
  verify_jwt,
  get_item_admin
);

export default item_router;