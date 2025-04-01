import { Db_Error_Response } from "./responses";
import db from "./pool";
import { error_logger } from "../util/error_handlers";

class Backup_Methods {
  async get_all_data() {
    try {
      const { rows: category_tbl } = await db.query("SELECT * FROM category_tbl;");
      const { rows: item_tbl } = await db.query("SELECT * FROM item_tbl;");
      const { rows: item_photo_tbl } = await db.query("SELECT * FROM item_photo_tbl;");
      const { rows: item_size_tbl } = await db.query("SELECT * FROM item_size_tbl;");
      const { rows: item_color_tbl } = await db.query("SELECT * FROM item_color_tbl;");
      const { rows: item_info_tbl } = await db.query("SELECT * FROM item_info_tbl;");
      return { category_tbl, item_tbl, item_photo_tbl, item_size_tbl, item_color_tbl, item_info_tbl };
    } catch (error) {
      error_logger("db -> backup-methods -> get_all_data\n", error);
      return new Db_Error_Response(error);
    } 
  }
}

const backup_methods = new Backup_Methods();

export default backup_methods;