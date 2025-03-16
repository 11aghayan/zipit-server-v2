import { Db_Error_Response, Db_Success_Response } from "./responses";
import db from "./pool";
import { error_logger } from "../util/error_handlers";
import { is_db_test } from "../util/db-utils";

class Auth_Methods {
  test = is_db_test();

  async get_credentials(username: string) {
    try {
      const { rows } = await db.query(
        `
          SELECT password_hash
          FROM user_tbl
          WHERE username = $1;
        `,
        [username]
      );
  
      return new Db_Success_Response<{ password_hash: string }>(rows);
    } catch (error) {
      error_logger("db -> auth-methods -> get_credentials\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async change_user_password(username: string, password_hash: string) {
    try {
      await db.query(
        `
          UPDATE user_tbl
          SET password_hash = $1
          WHERE username = $2;
        `,
        [password_hash, username]
      );
    } catch (error) {
      error_logger("db -> auth-methods -> change_user_password\n", error);
      return new Db_Error_Response(error);
    }
  }

  async populate_user_tbl() {
    if (!this.test) return;
    try {
      await db.query(
        `
          INSERT INTO user_tbl(username, password_hash)
          VALUES ('test_username', '$2b$10$3mBYnbs3dA4zrFYpSPx.re/JbM3c7z4AWHOJyxnIoQj.EspJj8BeO');
        `
      );
    } catch (error) {
      error_logger("db -> auth-methods -> populate_user_tbl\n", error);
      return new Db_Error_Response(error);
    } 
  }

  async clear_user_tbl() {
    if (!this.test) return;
    try {
      await db.query(
        `
          DELETE FROM user_tbl;
        `
      );
    } catch (error) {
      error_logger("db -> auth-methods -> clear_user_tbl\n", error);
      return new Db_Error_Response(error);
    }
  }
}

const auth_methods = new Auth_Methods();

export default auth_methods;