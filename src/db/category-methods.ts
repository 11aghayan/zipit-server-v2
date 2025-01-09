import { db, Db_Error_Response, Db_Success_Response } from ".";
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
        GROUP BY category_tbl.id, category_tbl.label_am, category_tbl.label_ru
        ORDER BY category_tbl.label_am;
      `
    );
    
    const other = rows.find(r => r.label_am === "Այլ" || r.label_ru === "Прочие");
    const filtered_rows = rows.filter(r => r.id !== other?.id);
    
    if (other) {
      filtered_rows.push(other);
    }
    
    return new Db_Success_Response<T_Category_Response_Admin>(filtered_rows);
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
        GROUP BY category_tbl.id, label
        ORDER BY category_tbl.label_${lang};
      `
    );

    const other = rows.find(r => r.label === "Այլ" || r.label === "Прочие");
    const filtered_rows = rows.filter(r => r.id !== other.id);
    
    filtered_rows.push(other);
    
    return new Db_Success_Response<T_Category_Response_Public>(filtered_rows);
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

export async function delete_category(id: T_ID) {
  try {
    await db.query(
      `
        DELETE FROM category_tbl
        WHERE id = $1;
      `,
      [id]
    );
  } catch (error) {
    error_logger("db -> category-methods -> delete_category\n", error);
    const pg_error = error as { code: string };
    if (pg_error.code === "23503") {
      return "Կատեգորիան ջնջելու համար այն պետք է չպարունակի որևէ ապրանք";
    }
    return new Db_Error_Response(error);
  }
}