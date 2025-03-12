import { Pool } from "pg";
import { Db_Error_Response, Db_Success_Response } from "./responses";
import { db, test_db } from "./pools";
import { error_logger } from "../util/error_handlers";

class Auth_Methods {
  db: Pool;
  test: boolean;

  constructor(db: Pool, test?: "test") {
    this.db = db;
    this.test = test === "test";
  }

  async get_credentials(username: string) {
    try {
      const { rows } = await this.db.query(
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
      await this.db.query(
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
      await this.db.query(
        `
          INSERT INTO user_tbl(username, password_hash)
          VALUES ('test_username', 'test_hashed_password');
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
      await this.db.query(
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

const auth_methods = new Auth_Methods(db);
export const auth_methods_test = new Auth_Methods(test_db, "test");

export default auth_methods;