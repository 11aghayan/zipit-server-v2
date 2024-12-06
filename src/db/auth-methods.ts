import { db, Db_Error_Response, Db_Success_Response } from ".";
import { error_logger } from "../util/error_handlers";



export async function get_credentials(username: string) {
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

export async function change_user_password(username: string, password_hash: string) {
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