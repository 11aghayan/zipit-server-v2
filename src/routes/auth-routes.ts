import express from "express";

import { check_credentials } from "../middleware/credentials";
import { change_password, login, logout, refresh_token } from "../controllers/auth-controllers";
import { verify_jwt } from "../middleware/verify-jwt";
import { check_new_password } from "../middleware/checks";

const auth_router = express.Router();

auth_router.post(
  '/login',
  check_credentials,
  login
);

auth_router.get("/refresh", refresh_token);
auth_router.get("/logout", logout);
auth_router.put("/change-password", verify_jwt, check_new_password, change_password);

export default auth_router;