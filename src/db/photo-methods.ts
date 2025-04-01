import { Db_Error_Response, Db_Success_Response } from "./responses";
import db from "./pool";
import { error_logger } from "../util/error_handlers";
import { T_ID } from "../types";

class Photo_Methods {

  async get_photo(id: T_ID, index: string) {
    try {
      const { rows } = await db.query(
        `
          SELECT src[$1]
          FROM item_photo_tbl
          WHERE id = $2;
        `,
        [index, id]
      );
      if (rows.length < 1 || rows[0]?.src === null) throw new Error("No photos found");
      return new Db_Success_Response<{ src: string }>(rows);
    } catch (error) {
      error_logger("db -> photo-methods -> get_photo\n", error);
      return new Db_Error_Response(error);
    }
  }
}

const photo_methods = new Photo_Methods();

export default photo_methods;