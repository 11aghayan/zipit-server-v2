import express from "express";

import { check_order } from "../middleware/checks";
import { confirm_order } from "../controllers/order-controllers";

const order_router = express.Router();

order_router.post(
  "/",
  check_order,
  confirm_order
);

export default order_router;