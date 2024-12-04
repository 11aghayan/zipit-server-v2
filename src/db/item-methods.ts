import { db, Db_Error_Response, Db_Success_Response } from "./db";
import { T_Filters, T_Item_Public_Full, T_Item_Public_Short, T_Lang } from "../types";
import { error_logger } from "../util/error_handlers";

export async function get_all_items_public({ categories, special_groups, count }: T_Filters, sorting: string, lang: T_Lang) {
  try {
    const { rows } = await db.query(
      ` SELECT 
          item_tbl.id, 
          name_${lang} as name,
          photo_id,
          price,
          promo,
          special_group,
          size_value,
          size_unit,
          color_${lang} as color
        FROM item_tbl
        INNER JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        INNER JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        INNER JOIN item_color_tbl
        ON item_info_tbl.color_id = item_color_tbl.id
        WHERE
        ($1::uuid[] IS NULL AND $2::char(3)[] IS NULL)
        OR 
        (category_id = ANY($1::uuid[]) OR special_group = ANY($2::char(3)[]))
        ORDER BY ${sorting}
        LIMIT $3;
      `,
      [categories, special_groups, count]
    );
    
    return new Db_Success_Response<T_Item_Public_Short>(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_all_items_public", error);
    return new Db_Error_Response(error);
  }
} 

export async function get_item_public(id: string, lang: T_Lang) {
  try {
    const { rows } = await db.query(
      `
        SELECT 
          item_tbl.id,
          category_id,
          label_${lang} as category,
          name_${lang} as name,
          photo_id,
          price,
          promo,
          size_id,
          size_value,
          size_unit,
          color_id,
          color_${lang} as color,
          min_order_value,
          min_order_unit,
          description_${lang} as description,
          special_group,
          available
        FROM item_tbl
        INNER JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        INNER JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        INNER JOIN item_color_tbl
        ON item_info_tbl.color_id = item_color_tbl.id 
        INNER JOIN category_tbl
        ON item_tbl.category_id = category_tbl.id
        WHERE item_tbl.id = $1;
      `,
      [id]
    );

    return new Db_Success_Response<T_Item_Public_Full>(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_item_public", error);
    return new Db_Error_Response(error);
  }
}