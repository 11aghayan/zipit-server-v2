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

export async function update_refresh_token(refresh_token: string | null) {
  try {
    await db.query(
      `
        UPDATE user_tbl
        SET refresh_token = $1;
      `,
      [refresh_token]
    );
  } catch (error) {
    error_logger("db -> auth-methods -> update_refresh_token\n", error);
    return new Db_Error_Response(error);
  }
}

export async function get_user_by_refresh_token(refresh_token: string) {
  try {
    const { rows } = await db.query(
      `
        SELECT username
        FROM user_tbl
        WHERE refresh_token = $1;
      `,
      [refresh_token]
    );

    return new Db_Success_Response<{ username: string }>(rows);
  } catch (error) {
    error_logger("db -> auth-methods -> get_user_by_refresh_token\n", error);
    return new Db_Error_Response(error);
  }
}