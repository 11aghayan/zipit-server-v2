import { db, Db_Error_Response, Db_Success_Response } from "./db";
import { error_logger } from "../util/error_handlers";
import { T_Category_Response_Full } from "../types";

export async function get_categories_full() {
  try {
    const { rows } = await db.query(
      `
        SELECT
          category_tbl.id,
          category_tbl.label_am,
          category_tbl.label_ru,
          COUNT(category_tbl.id) as item_count
        FROM category_tbl
        INNER JOIN (
          SELECT category_id
          FROM item_tbl
        ) as item_tbl
        ON category_tbl.id = item_tbl.category_id
        GROUP BY category_tbl.id;
      `
    );

    return new Db_Success_Response<T_Category_Response_Full>(rows);
  } catch (error) {
    error_logger("db -> category-methods -> get_categories_full\n", error);
    return new Db_Error_Response(error);
  }
}