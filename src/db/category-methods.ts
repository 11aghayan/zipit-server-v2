import { db, Db_Error_Response, Db_Success_Response } from "./db";
import { error_logger } from "../util/error_handlers";
import { T_Category_Response_Admin, T_Category_Response_Public, T_Lang } from "../types";

export async function get_categories_admin() {
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

    return new Db_Success_Response<T_Category_Response_Admin>(rows);
  } catch (error) {
    error_logger("db -> category-methods -> get_categories_admin\n", error);
    return new Db_Error_Response(error);
  }
}

export async function get_categories_public(lang: T_Lang) {
  try {
    const { rows } = await db.query(
      `
        SELECT
          category_tbl.id,
          category_tbl.label_${lang} as label,
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

    return new Db_Success_Response<T_Category_Response_Public>(rows);
  } catch (error) {
    error_logger("db -> category-methods -> get_categories_public\n", error);
    return new Db_Error_Response(error);
  }
}