import { Db_Error_Response, Db_Success_Response } from "./responses";
import { db, test_db } from "./pools";
import { error_logger } from "../util/error_handlers";
import { T_ID } from "../types";
import { Pool } from "pg";

class Photo_Methods {
  db: Pool;
  
  constructor(db: Pool) {
    this.db = db;
  }

  async get_photo(id: T_ID, index: string) {
    try {
      const { rows } = await this.db.query(
        `
          SELECT src[$1]
          FROM item_photo_tbl
          WHERE id = $2;
        `,
        [index, id]
      );
  
      return new Db_Success_Response<{ src: string }>(rows);
    } catch (error) {
      error_logger("db -> photo-methods -> get_photo\n", error);
      return new Db_Error_Response(error);
    }
  }
}

const photo_methods = new Photo_Methods(db);
export const photo_methods_test = new Photo_Methods(test_db);

export default photo_methods;