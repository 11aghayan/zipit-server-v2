import { db, Db_Error_Response, Db_Success_Response } from "./db";
import { error_logger } from "../util/error_handlers";
import { T_ID } from "../types";

export async function get_photo(id: T_ID) {
  try {
    const { rows } = await db.query(
      `
        SELECT src
        FROM item_photo_tbl
        WHERE id = $1;
      `,
      [id]
    );

    return new Db_Success_Response<{ src: string }>(rows);
  } catch (error) {
    error_logger("db -> photo-methods -> get_photo\n", error);
    return new Db_Error_Response(error);
  }
}