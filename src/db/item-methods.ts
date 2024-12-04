import { db, Db_Error_Response, Db_Success_Response } from "./db";
import { T_Filters, T_Item_Public_Full, T_Item_Public_Short, T_Lang, T_ID, T_Special_Group, T_Size_Unit } from "../types";
import { error_logger } from "../util/error_handlers";

export async function get_all_items_public({ categories, special_groups, count }: T_Filters, sorting: string, lang: T_Lang) {
  try {
    const { rows } = await db.query(
      ` SELECT 
          ${short_items_keys(lang)}
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

export async function get_similar_items(category_id: T_ID, special_group: T_Special_Group | null, size_unit: T_Size_Unit, count: number, lang: T_Lang) {
  try {
    let rows: T_Item_Public_Short[] = [];
    
    const { rows: rows_1 } = await db.query(
      `
        SELECT ${short_items_keys(lang)}
        FROM item_tbl
        INNER JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        INNER JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        INNER JOIN item_color_tbl
        ON item_info_tbl.color_id = item_color_tbl.id
        WHERE category_id = $1
        LIMIT $2;
      `,
      [category_id, count]
    );

    rows = [...rows_1];
    
    if (rows.length < count && special_group) {
      const { rows: rows_2 } = await db.query(
        `
          SELECT ${short_items_keys(lang)}
          FROM item_tbl
          INNER JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          INNER JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          INNER JOIN item_color_tbl
          ON item_info_tbl.color_id = item_color_tbl.id
          WHERE special_group = $1
          LIMIT $2;
        `,
        [special_group, count - rows.length]
      );

      rows = [...rows, ...rows_2];
    }

    rows = remove_duplicates(rows);
    
    if (rows.length < count) {
      const { rows: rows_2 } = await db.query(
        `
          SELECT ${short_items_keys(lang)}
          FROM item_tbl
          INNER JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          INNER JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          INNER JOIN item_color_tbl
          ON item_info_tbl.color_id = item_color_tbl.id
          WHERE size_unit = $1
          LIMIT $2;
        `,
        [size_unit, count - rows.length]
      );

      rows = [...rows, ...rows_2];
    }
    
    rows = remove_duplicates(rows);
    
    if (rows.length < count) {
      const { rows: rows_2 } = await db.query(
        `
          SELECT ${short_items_keys(lang)}
          FROM item_tbl
          INNER JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          INNER JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          INNER JOIN item_color_tbl
          ON item_info_tbl.color_id = item_color_tbl.id
          ORDER BY 
            CASE special_group
                WHEN 'liq' THEN 1
                WHEN 'promo' THEN 2
                WHEN 'new' THEN 3
                ELSE 4
            END
          LIMIT $1;
        `,
        [count - rows.length]
      );

      rows = [...rows, ...rows_2];
    }
    
    rows = remove_duplicates(rows);
    return new Db_Success_Response(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_similar_items", error);
    return new Db_Error_Response(error);
  }
}

function short_items_keys(lang: T_Lang) {
  return `
    item_tbl.id, 
    name_${lang} as name,
    photo_id,
    price,
    promo,
    special_group,
    size_value,
    size_unit,
    color_${lang} as color
  `
}

function remove_duplicates<T extends { id: T_ID }>(arr: T[]) {
  return arr.reduce((prev: T[], current: T) => {
    const id_exists = prev.find(obj => obj.id === current.id);
    if (id_exists) return prev;
    return [
      ...prev,
      current
    ];
  }, [] as T[]);
}