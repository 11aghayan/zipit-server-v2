import { db, Db_Error_Response, Db_Success_Response } from "./db";
import { error_logger } from "../util/error_handlers";
import { T_Category_Response_Admin, T_Category_Response_Public, T_ID, T_Lang } from "../types";

export async function get_categories_admin() {
  try {
    const { rows } = await db.query(
      `
        SELECT
          category_tbl.id,
          category_tbl.label_am,
          category_tbl.label_ru,
          COUNT(item_tbl.category_id) AS item_count
        FROM category_tbl
        LEFT JOIN item_tbl ON category_tbl.id = item_tbl.category_id
        GROUP BY category_tbl.id, category_tbl.label_am, category_tbl.label_ru;
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
          COUNT(item_tbl.category_id) AS item_count
        FROM category_tbl
        LEFT JOIN item_tbl ON category_tbl.id = item_tbl.category_id
        GROUP BY category_tbl.id, label;
      `
    );

    return new Db_Success_Response<T_Category_Response_Public>(rows);
  } catch (error) {
    error_logger("db -> category-methods -> get_categories_public\n", error);
    return new Db_Error_Response(error);
  }
}

export async function add_category(label_am: string, label_ru: string) {
  try {
    await db.query(
      `
        INSERT INTO 
        category_tbl(label_am, label_ru)
        VALUES($1, $2);
      `,
      [label_am, label_ru]
    );
  } catch (error) {
    error_logger("db -> category-methods -> add_category\n", error);
    return new Db_Error_Response(error);
  }
}

export async function edit_category(id: T_ID,label_am: string, label_ru: string) {
  try {
    await db.query(
      `
        UPDATE category_tbl
        SET label_am = $1,
            label_ru = $2
        WHERE id = $3;
      `,
      [label_am, label_ru, id]
    );
  } catch (error) {
    error_logger("db -> category-methods -> edit_category\n", error);
    return new Db_Error_Response(error);
  }
}