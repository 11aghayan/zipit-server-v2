import jwt, { VerifyErrors } from "jsonwebtoken";
import bcrypt from "bcrypt";

import * as Db from "../db";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export const check_credentials: T_Controller = async function(req, res, next) {
  const { username, password } = req.body;

  if (!username) return custom_error(res, 400, "username-ը բացակայում է");
  if (!password) return custom_error(res, 400, "password-ը բացակայում է");
  if (typeof username !== "string") return custom_error(res, 400, `typeof username is ${typeof username}`); 
  if (typeof password !== "string") return custom_error(res, 400, `typeof password is ${typeof password}`); 

  try {
    const response = await Db.get_credentials(username);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 400, "Credentials fetching error");
    }

    if (response.rows.length < 1) return custom_error(res, 401, "Սխալ օգտվողի անուն կամ գաղտնաբառ");
    
    const { password_hash } = response.rows[0];
    const is_password_correct = await bcrypt.compare(password, password_hash);

    if (!is_password_correct) return custom_error(res, 401, "Սխալ օգտվողի անուն կամ գաղտնաբառ");
    
    next();
  } catch (error) {
   return server_error(res, "check_credentials", error); 
  }
}

export const verify_jwt: T_Controller = async function(req, res, next) {
  const { jwt: refresh_token } = req.cookies;
  const { authorization } = req.headers;

  if (!authorization || !refresh_token) return res.sendStatus(401);

  const access_token = authorization.split(" ")[1];
  
  const handle_verification = (err: VerifyErrors | null) => {
    if (err) return res.sendStatus(403);
    next();
  };
  
  jwt.verify(access_token, process.env.JWT_ACCESS_TOKEN_SECRET!, handle_verification)
}