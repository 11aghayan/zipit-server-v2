import { db, Db_Error_Response, Db_Success_Response } from ".";
import { T_Filters, T_Item_Public_Full, T_Item_Public_Short, T_Lang, T_ID, T_Special_Group, T_Size_Unit, T_Item_Admin_Short, T_Item_Admin_Full, T_Item_Body, T_Item_Body_Edit, T_Item_Body_Variant, T_Item_Body_Variant_Edit } from "../types";
import { error_logger } from "../util/error_handlers";
import { remove_duplicates, short_items_keys } from "../util/db-utils";
import { create_item_variant, delete_item_variant, edit_item_variant } from "../util/item-utils";

export async function get_all_items_public({ categories, special_groups, count, offset, search }: T_Filters, sorting: string, lang: T_Lang) {
  try {
    const { rows } = await db.query(
      ` 
        SELECT 
          i_id as id, 
          name_${lang} as name,
          photo_id,
          price,
          promo,
          special_group,
          size_value,
          size_unit,
          color_${lang} as color,
          count
        FROM (
          SELECT 
            *,
            item_tbl.id as i_id,
            COUNT(*) OVER()
          FROM item_tbl
          LEFT JOIN item_info_tbl
            ON item_tbl.id = item_info_tbl.item_id
          LEFT JOIN item_size_tbl
            ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
            ON item_info_tbl.color_id = item_color_tbl.id
          WHERE
            (
              ($1::uuid[] IS NULL AND $2::char(3)[] IS NULL)
              OR 
              (category_id = ANY($1::uuid[]) OR special_group = ANY($2::char(3)[]))
            )
            AND
            (
              $5::TEXT IS NULL
              OR
              name_am ILIKE $5
              OR
              name_ru ILIKE $5
            )
          ORDER BY ${sorting}
          LIMIT $3
          OFFSET $4
        );
      `,
      [categories, special_groups, count, offset, search]
    );
    
    return new Db_Success_Response<T_Item_Public_Short>(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_all_items_public\n", error);
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
        LEFT JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        LEFT JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        LEFT JOIN item_color_tbl
        ON item_info_tbl.color_id = item_color_tbl.id 
        LEFT JOIN category_tbl
        ON item_tbl.category_id = category_tbl.id
        WHERE item_tbl.id = $1;
      `,
      [id]
    );

    return new Db_Success_Response<T_Item_Public_Full>(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_item_public\n", error);
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
        LEFT JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        LEFT JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        LEFT JOIN item_color_tbl
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
          LEFT JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          LEFT JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
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
          LEFT JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          LEFT JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
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
          LEFT JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          LEFT JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
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
    error_logger("db -> item-methods -> get_similar_items\n", error);
    return new Db_Error_Response(error);
  }
}

export async function get_all_items_admin({ categories, special_groups, count, offset, search }: T_Filters, sorting: string) {
  try {
    const { rows } = await db.query(
      `SELECT 
          i_id as id,
          name,
          p_id as photo_id,
          count
        FROM(
          SELECT
            item_tbl.id as i_id,
            item_tbl.name_am as name,
            item_info_tbl.photo_id as p_id,
            *,
            COUNT(*) OVER()
          FROM item_tbl
          LEFT JOIN item_info_tbl
            ON item_tbl.id = item_info_tbl.item_id
          LEFT JOIN item_size_tbl
            ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
            ON item_info_tbl.color_id = item_color_tbl.id
          WHERE
            (
              ($1::uuid[] IS NULL AND $2::char(3)[] IS NULL)
              OR 
              (category_id = ANY($1::uuid[]) OR special_group = ANY($2::char(3)[]))
            )
            AND
            (
              $5::TEXT IS NULL
              OR
              name_am ILIKE $5
              OR
              name_ru ILIKE $5
            )
          ORDER BY ${sorting}
          LIMIT $3
          OFFSET $4
        );
      `,
      [categories, special_groups, count, offset, search]
    );

    const filtered_rows = remove_duplicates(rows);

    return new Db_Success_Response<T_Item_Admin_Short>(filtered_rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_all_items_admin\n", error);
    return new Db_Error_Response(error);
  }
}

export async function get_item_admin(id: T_ID) {
  try {
    const { rows } = await db.query(
      `
        SELECT *
        FROM item_tbl
        LEFT JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        LEFT JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        LEFT JOIN item_color_tbl
        ON item_info_tbl.color_id = item_color_tbl.id
        LEFT JOIN item_photo_tbl
        ON item_info_tbl.photo_id = item_photo_tbl.id
        WHERE item_tbl.id = $1;
      `,
      [id]
    );

    return new Db_Success_Response<T_Item_Admin_Full>(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_item_admin\n", error);
    return new Db_Error_Response(error);
  }
}

export async function add_item({ category_id, name_am, name_ru, variants }: T_Item_Body) {
  try {
    await db.query('BEGIN;');
    const item_id = (await db.query(
      `
        INSERT INTO 
        item_tbl(category_id, name_am, name_ru)
        VALUES($1, $2, $3)
        RETURNING id;
      `,
      [category_id, name_am, name_ru]
    )).rows[0].id as T_ID;

    const queries = variants.map((variant) => {
      return create_item_variant(item_id, variant, db);
    });
    
    await Promise.all(queries);
    
    await db.query("COMMIT;");
  } catch (error) {
    await db.query("ROLLBACK;");
    error_logger("db -> item-methods -> add_item\n", error);
    return new Db_Error_Response(error);
  }
}

export async function edit_item(item: T_Item_Body_Edit & { id: T_ID }) {
  try {
    await db.query("BEGIN;");

    await db.query(
      `
        UPDATE item_tbl
        SET category_id = $1,
            name_am = $2,
            name_ru = $3
        WHERE id = $4;
      `,
      [item.category_id, item.name_am, item.name_ru, item.id]
    );
    
    for (let variant of item.variants) {
      if ('photo_id' in variant && 'delete' in variant) {
        await delete_item_variant(variant, db);
      } else if ('photo_id' in variant) {
        await edit_item_variant(variant as T_Item_Body_Variant_Edit, db);
      } else {
        await create_item_variant(item.id, variant, db);
      }
    }
    
    await db.query("COMMIT;");
  } catch (error) {
    error_logger("db -> item-methods -> edit_item\n", error);
    await db.query("ROLLBACK;");
    return new Db_Error_Response(error);
  }
}

export async function delete_item(id: T_ID) {
  try {
    await db.query(
      `
        DELETE FROM item_tbl
        WHERE id = $1;
      `,
      [id]
    );
  } catch (error) {
    error_logger("db -> item-methods -> delete_item\n", error);
    return new Db_Error_Response(error);
  }
}

export async function get_matching_items(query: string, lang: T_Lang, limit: number) {
  try {
    const { rows } = await db.query(
      `
        SELECT ${short_items_keys(lang)}
        FROM item_tbl
        LEFT JOIN category_tbl
        ON category_tbl.id = item_tbl.category_id
        LEFT JOIN item_info_tbl
        ON item_tbl.id = item_info_tbl.item_id
        LEFT JOIN item_size_tbl
        ON item_info_tbl.size_id = item_size_tbl.id
        LEFT JOIN item_color_tbl
        ON item_info_tbl.color_id = item_color_tbl.id 
        WHERE 
          name_am ILIKE $1
          OR
          name_ru ILIKE $1
          OR
          label_am ILIKE $1
          OR
          label_ru ILIKE $1
          OR
          description_am ILIKE $1
          OR
          description_ru ILIKE $1
        LIMIT $2;
      `,
      [query, limit]
    );

    return new Db_Success_Response<T_Item_Public_Short>(rows);
  } catch (error) {
    error_logger("db -> item-methods -> get_matching_items\n", error);
    return new Db_Error_Response(error);
  }
}
