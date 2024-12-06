import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
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
  const { jwt_token } = req.cookies;

  if (!jwt_token) return custom_error(res, 401, "Unauthorized");
  
  const handle_verification = (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
    if (err) return custom_error(res, 403, "Forbidden");
    req.body.jwt_payload = decoded;
    next();
  };
  
  jwt.verify(jwt_token, process.env.JWT_TOKEN_SECRET as string, handle_verification)
}