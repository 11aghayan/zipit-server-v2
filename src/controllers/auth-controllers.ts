import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";

import * as Db from "../db";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

const { JWT_REFRESH_TOKEN_SECRET, JWT_ACCESS_TOKEN_SECRET } = process.env as { [key: string]: string };
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

export const login: T_Controller = async function(req, res) {
  const { username } = req.body;
  
  try {
    const access_token = jwt.sign({ username }, JWT_ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    const refresh_token = jwt.sign({ username }, JWT_REFRESH_TOKEN_SECRET, { expiresIn: "1d" });

    const db_response = await  Db.update_refresh_token(refresh_token);
    if (db_response instanceof Db.Db_Error_Response) return custom_error(res, 400, "Refresh token updating error");
    
    res.cookie('jwt', refresh_token, { httpOnly: true, sameSite: 'none', maxAge: COOKIE_MAX_AGE, secure: true });
    return res.status(200).json({ access_token });
  } catch (error) {
    return server_error(res, "login", error);
  }
}

export const refresh_token: T_Controller = async function(req, res) {
  const refresh_token = req.cookies.jwt;

  if (!refresh_token) return res.sendStatus(401);
  try {
    const user = await Db.get_user_by_refresh_token(refresh_token);
    if (user instanceof Db.Db_Error_Response) return custom_error(res, 400, "User fetching error");
    if (user.rows.length < 1) return res.sendStatus(403);

    const { username } = user.rows[0];
    
    const handle_verification = (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
      if (err || username !== (decoded as JwtPayload)?.username) return res.sendStatus(403);
      
      const access_token = jwt.sign({ username }, JWT_ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

      return res.status(200).json({ access_token });
    };
    
    jwt.verify(refresh_token, JWT_REFRESH_TOKEN_SECRET, handle_verification);
  } catch (error) {
    return server_error(res, "refresh_token", error);
  }
}

export const logout: T_Controller = async function(req, res) {
  const refresh_token = req.cookies.jwt;

  if (!refresh_token) return res.sendStatus(200);
  
  const user = await Db.get_user_by_refresh_token(refresh_token);
  if (user instanceof Db.Db_Error_Response) return custom_error(res, 400, "User fetching error");

  if (user.rows.length < 1) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return res.sendStatus(200);
  }
  
  const response = await Db.update_refresh_token(null);
  if (response instanceof Db.Db_Error_Response) return custom_error(res, 400, "Refresh token updating error");

  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  return res.sendStatus(200);
}

export const change_password: T_Controller = async function(req, res) {
  
}