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

    return new Db_Success_Response(rows);
  } catch (error) {
    error_logger("db -> auth-methods -> get_credentials\n", error);
    return new Db_Error_Response(error);
  }
}