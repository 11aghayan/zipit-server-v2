import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import Db from "../db/auth-methods";
import { Db_Error_Response } from "../db/responses";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET as string;
const COOKIE_MAX_AGE = 3 * 60 * 60 * 1000;

export const login: T_Controller = async function(req, res) {
  const { username } = req.body;

  try {
    const jwt_token = jwt.sign({ username }, JWT_TOKEN_SECRET, { expiresIn: "3h" });
    res.cookie('jwt_token', jwt_token, { httpOnly: true, sameSite: "strict", maxAge: COOKIE_MAX_AGE, secure: true, domain: process.env.COOKIE_DOMAIN as string });
    return res.sendStatus(200);
  } catch (error) {
    return server_error(res, "login", error);
  }
}

export const logout: T_Controller = async function(req, res) {
  const { jwt_token } = req.cookies;
  if (jwt_token) res.clearCookie("jwt_token", { httpOnly: true, sameSite: "strict", secure: true, domain: process.env.COOKIE_DOMAIN as string });
  return res.sendStatus(200);
}

export const change_password: T_Controller = async function(req, res) {
  const { password, new_password, jwt_payload: { username } } = req.body;
  
  try {
    const user = await Db.get_credentials(username);
    if (user instanceof Db_Error_Response) return custom_error(res, 400, "User fetching error");
    if (user.rows.length < 1) return custom_error(res, 403, "Forbidden");
    const { password_hash } = user.rows[0];

    const is_password_correct = await bcrypt.compare(password, password_hash);
    if (!is_password_correct) return custom_error(res, 403, "Սխալ գաղտնաբառ");
    
    const new_password_hash = await bcrypt.hash(new_password, 10);

    const response = await Db.change_user_password(username, new_password_hash);
    if (response instanceof Db_Error_Response) return custom_error(res, 400, "Password updating error");

    return res.sendStatus(200);
  } catch (error) {
    return server_error(res, "change_password", error);
  }
}