import { Db_Error_Response, Db_Success_Response } from "./responses";
import db from "./pool";
import { 
  T_Filters, 
  T_Item_Public_Full, 
  T_Item_Public_Short, 
  T_Lang, 
  T_ID, 
  T_Special_Group, 
  T_Size_Unit, 
  T_Item_Admin_Short, 
  T_Item_Admin_Full, 
  T_Item_Body, 
  T_Item_Body_Edit, 
  T_Item_Body_Variant_Edit,
  T_Cart_Item_Request,
  T_Item_Body_Variant_Delete,
  T_Item_Body_Variant} from "../types";
import { error_logger } from "../util/error_handlers";
import { is_db_test, remove_duplicates, short_items_keys } from "../util/db-utils";
import { valid_photo_src } from "../test/test-util";

class Item_Methods {
  test = is_db_test();

  async get_all_items_public({ categories, special_groups, count, offset, search }: T_Filters, sorting: string, lang: T_Lang) {
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
            min_order_value,
            min_order_unit,
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
      
      return new Db_Success_Response<T_Item_Public_Short>(rows.map(row => ({ 
        ...row, 
        count: Number(row.count),
        min_order_value: Number(row.min_order_value),
        price: Number(row.price),
        promo: row.promo === null ? null : Number(row.promo),
        size_value: Number(row.size_value)
      })));
    } catch (error) {
      error_logger("db -> item-methods -> get_all_items_public\n", error);
      return new Db_Error_Response(error);
    }
  } 
  
  async get_item_public(id: string, lang: T_Lang) {
    try {
      if (typeof id !== "string") throw new Error(`typeof id must be "string", provided ${typeof id}`);
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
            available,
            array_length(src, 1) as photo_count
          FROM item_tbl
          LEFT JOIN item_info_tbl
            ON item_tbl.id = item_info_tbl.item_id
          LEFT JOIN item_size_tbl
            ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
            ON item_info_tbl.color_id = item_color_tbl.id 
          LEFT JOIN item_photo_tbl
            ON item_photo_tbl.id = item_info_tbl.photo_id
          LEFT JOIN category_tbl
            ON item_tbl.category_id = category_tbl.id
          WHERE item_tbl.id = $1
        `,
        [id]
      );
  
      return new Db_Success_Response<T_Item_Public_Full>(rows.map((r: T_Item_Public_Full) => ({ 
        ...r,
        available: Number(r.available),
        min_order_value: Number(r.min_order_value),
        price: Number(r.price),
        promo: r.promo === null ? null : Number(r.promo),
        size_value: Number(r.size_value)
      })));
    } catch (error) {
      error_logger("db -> item-methods -> get_item_public\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async get_similar_items(item_id: T_ID, category_id: T_ID, special_group: T_Special_Group | null, size_unit: T_Size_Unit, count: number, lang: T_Lang) {
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
          WHERE category_id = $1 AND item_tbl.id != $3
          LIMIT $2;
        `,
        [category_id, count, item_id]
      );
  
      rows = remove_duplicates(rows_1);
      
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
            WHERE special_group = $1 AND item_tbl.id != $3
            LIMIT $2;
          `,
          [special_group, count - rows.length, item_id]
        );
  
        rows = remove_duplicates([...rows, ...rows_2]);
      }
  
      
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
            WHERE size_unit = $1 AND item_tbl.id != $3
            LIMIT $2;
          `,
          [size_unit, count - rows.length, item_id]
        );
  
        rows = remove_duplicates([...rows, ...rows_2]);
      }
      
      
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
            WHERE item_tbl.id != $2
            ORDER BY 
              CASE special_group
                  WHEN 'liq' THEN 1
                  WHEN 'promo' THEN 2
                  WHEN 'new' THEN 3
                  ELSE 4
              END
            LIMIT $1;
          `,
          [count - rows.length, item_id]
        );
        rows = remove_duplicates([...rows, ...rows_2]);
      }
      
      return new Db_Success_Response(rows);
    } catch (error) {
      error_logger("db -> item-methods -> get_similar_items\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async get_cart_items(items: T_Cart_Item_Request[], lang: T_Lang) {
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
            min_order_value,
            min_order_unit,
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
            WHERE item_tbl.id = ANY($1::uuid[])
          );
        `
        , 
        [items.map(i => i.item_id)]
      ) as { rows: T_Item_Public_Short[] };
  
      const filtered_rows = rows.filter(i => items.some(item => item.photo_id === i.photo_id));
      
      return new Db_Success_Response<T_Item_Public_Short>(filtered_rows.map(r => ({ 
        ...r, 
        min_order_value: Number(r.min_order_value), 
        size_value: Number(r.size_value),
        price: Number(r.price),
        promo: r.promo === null ? null : Number(r.promo)
      })));
    } catch (error) {
      error_logger("db -> item-methods -> get_cart_items\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async get_items_by_photo_ids(photo_ids: T_ID[]) {
    try {
      const { rows } = await db.query(
        `
          SELECT *
            FROM item_info_tbl
          LEFT JOIN item_tbl
            ON item_info_tbl.item_id = item_tbl.id 
          LEFT JOIN item_size_tbl
            ON item_info_tbl.size_id = item_size_tbl.id
          LEFT JOIN item_color_tbl
            ON item_info_tbl.color_id = item_color_tbl.id
          WHERE item_info_tbl.photo_id = ANY($1::uuid[]);
        `,
        [photo_ids]
      );
  
      return new Db_Success_Response<T_Item_Admin_Full>(rows.map(row => ({
        ...row,
        creation_date: Number(row.creation_date),
        available: Number(row.available),
        price: Number(row.price),
        promo: row.promo === null ? null : Number(row.promo),
        size_value: Number(row.size_value),
        min_order_value: Number(row.min_order_value)
      })));
    } catch (error) {
      error_logger("db -> item-methods -> get_items_by_photo_id\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async get_all_items_admin({ categories, special_groups, count, offset, search }: T_Filters, sorting: string) {
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
  
      const filtered_rows = remove_duplicates(rows.map(row => ({ ...row, count: Number(row.count) })));
  
      return new Db_Success_Response<T_Item_Admin_Short>(filtered_rows);
    } catch (error) {
      error_logger("db -> item-methods -> get_all_items_admin\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async get_item_admin(id: T_ID) {
    try {
      if (typeof id !== "string") {
        throw new Error("ID must be of type string");
      }
      const rows = (await db.query(
        `
          SELECT item_tbl.id as i_id, *
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
      )).rows.map(item => {
        const temp = JSON.parse(JSON.stringify(item));
        temp.id = temp.i_id;
        delete temp.i_id;
        return temp;
      });
      
      return new Db_Success_Response<T_Item_Admin_Full>(rows.map((row: T_Item_Admin_Full) => ({ 
        ...row,
        creation_date: Number(row.creation_date),
        available: Number(row.available),
        min_order_value: Number(row.min_order_value),
        size_value: Number(row.size_value),
        price: Number(row.price),
        promo: row.promo === null ? null : Number(row.promo)
      })));
    } catch (error) {
      error_logger("db -> item-methods -> get_item_admin\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async add_item({ category_id, name_am, name_ru, variants }: T_Item_Body) {
    try {
      if (
        typeof name_am !== "string" || name_am.length < 1
        ||
        typeof name_ru !== "string" || name_ru.length < 1
      ) {
        throw new Error("type of name_am and type of name_ru must be string, the length must be greater than 0");
      }
      if (!Array.isArray(variants) || variants.length < 1) {
        throw new Error("variants must be an array and have a length greater than 0");
      }
      for (const variant of variants) {
        if (
          typeof variant.color_am !== "string" || variant.color_am.length < 1
          ||
          typeof variant.color_ru !== "string" || variant.color_ru.length < 1
        ) {
          throw new Error("type of color_am and type of color_ru must be string, the length must be greater than 0");
        }
        if (variant?.src.length < 1) {
          throw new Error("Item must have at least one photo");
        }
      }
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
  
      for (let variant of variants) {
        await this.create_item_variant(item_id, variant);
      }
      
      await db.query("COMMIT;");
  
      return new Db_Success_Response<T_ID>([item_id]);
    } catch (error) {
      await db.query("ROLLBACK;");
      error_logger("db -> item-methods -> add_item\n", error);
      return new Db_Error_Response(error);
    }
  }
  
  async edit_item(item: T_Item_Body_Edit & { id: T_ID }) {
    try {
      if (
          typeof item.name_am !== "string" || typeof item.name_ru !== "string"
          ||
          item.name_am.length < 1 || item.name_ru.length < 1
        ) {
        throw new Error("name_am and name_ru must be string and have length bigger than 0");
      }

      for (const variant of item.variants) {
        if (!("delete" in variant)) {
          if (typeof variant.available !== "number" || isNaN(variant.available)) {
            throw new Error("type of available must be number");
          }
          if (
            typeof variant.color_am !== "string" || typeof variant.color_ru !== "string"
            ||
            variant.color_am.length < 1 || variant.color_ru.length < 1
          ) {
            throw new Error("color_am and color_ru must be string and have length bigger than 0");
          }
          if (
            (typeof variant.description_am !== "string" || typeof variant.description_ru !== "string")
            &&
            (variant.description_am !== null || variant.description_ru !== null)
          ) {
            throw new Error("description_am and description_ru must be string or null");
          }
          if (typeof variant.min_order_value !== "number" || isNaN(variant.min_order_value)) {
            throw new Error("type of min_order_value must be number");
          }
          if (typeof variant.size_value !== "number" || isNaN(variant.size_value)) {
            throw new Error("type of size_value must be number");
          }
          if (typeof variant.price !== "number" || isNaN(variant.price)) {
            throw new Error("type of price must be number");
          }
          if (variant.promo !== null && (typeof variant.promo !== "number" || isNaN(variant.promo))) {
            throw new Error("type of promo must be number or null");
          }
          if (typeof variant.special_group !== "string" && variant.special_group !== null) {
            throw new Error("type of special group must be either string or null");
          }
          if (!Array.isArray(variant.src) || variant.src.length < 1) {
            throw new Error("photo src must be a non empty string array");
          }
          for (const photo_src of variant.src) {
            if (typeof photo_src !== "string" || photo_src.length < 1) {
              throw new Error("type of an element in photo src must be a non empty string");
            }
          }
        }
      }
      
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
          await this.delete_item_variant(variant);
        } else if ('photo_id' in variant) {
          await this.edit_item_variant(variant as T_Item_Body_Variant_Edit);
        } else {
          await this.create_item_variant(item.id, variant);
        }
      }
      
      await db.query("COMMIT;");
    } catch (error) {
      error_logger("db -> item-methods -> edit_item\n", error);
      await db.query("ROLLBACK;");
      return new Db_Error_Response(error);
    }
  }
  
  async delete_item(id: T_ID) {
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
  
  async get_matching_items(query: string, lang: T_Lang, limit: number) {
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
  
  async create_item_variant(item_id: string, variant: T_Item_Body_Variant) {
    const photo_id = (await db.query(
      `
        INSERT INTO 
        item_photo_tbl(item_id, src)
        VALUES($1, $2)
        RETURNING id;
      `,
      [item_id, variant.src]
    )).rows[0].id as T_ID;
  
    const size_id = (await db.query(
      `
        INSERT INTO 
        item_size_tbl(size_value, size_unit, item_id)
        VALUES($1, $2, $3)
        RETURNING id;
      `,
      [variant.size_value, variant.size_unit, item_id]
    )).rows[0].id as T_ID;
  
    const color_id = (await db.query(
      `
        INSERT INTO 
        item_color_tbl(color_am, color_ru, item_id)
        VALUES($1, $2, $3)
        RETURNING id;
      `,
      [variant.color_am, variant.color_ru, item_id]
    )).rows[0].id as T_ID;
  
    await db.query(
      `
        INSERT INTO item_info_tbl
        (
          price,
          promo,
          min_order_value,
          min_order_unit,
          description_am,
          description_ru,
          special_group,
          available,
          item_id,
          size_id,
          color_id,
          photo_id
        )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `,
      [
        variant.price, 
        variant.promo, 
        variant.min_order_value, 
        variant.min_order_unit, 
        variant.description_am, 
        variant.description_ru,
        variant.special_group,
        variant.available,
        item_id,
        size_id,
        color_id,
        photo_id
      ]
    );
  }
  
  async edit_item_variant(variant: T_Item_Body_Variant_Edit) {
    await db.query(
      `
        UPDATE item_photo_tbl
        SET src = $1
        WHERE id = $2;
      `,
      [variant.src, variant.photo_id]
    );
  
    await db.query(
      `
        UPDATE item_size_tbl
        SET size_value = $1,
            size_unit = $2
        WHERE id = $3;
      `,
      [variant.size_value, variant.size_unit, variant.size_id]
    );
  
    await db.query(
      `
        UPDATE item_color_tbl
        SET color_am = $1,
            color_ru = $2
        WHERE id = $3;
      `,
      [variant.color_am, variant.color_ru, variant.color_id]
    );
  
    await db.query(
      `
        UPDATE item_info_tbl
        SET price = $1,
            promo = $2,
            min_order_value = $3,
            min_order_unit = $4,
            description_am = $5,
            description_ru = $6,
            special_group = $7,
            available = $8
        WHERE photo_id = $9;
      `,
      [
        variant.price, 
        variant.promo, 
        variant.min_order_value, 
        variant.min_order_unit, 
        variant.description_am, 
        variant.description_ru,
        variant.special_group,
        variant.available,
        variant.photo_id
      ]
    );
  }
  
  async delete_item_variant({ color_id, photo_id, size_id }: T_Item_Body_Variant_Delete) {
    await db.query(
      `
        DELETE FROM item_info_tbl
        WHERE photo_id = $1;
      `,
      [photo_id]
    );
  
    await db.query(
      `
        DELETE FROM item_photo_tbl
        WHERE id = $1;
      `,
      [photo_id]
    );
  
    await db.query(
      `
        DELETE FROM item_color_tbl
        WHERE id = $1;
      `,
      [color_id]
    );
  
    await db.query(
      `
        DELETE FROM item_size_tbl
        WHERE id = $1;
      `,
      [size_id]
    );
  }

  async populate_item_tbl(category_id_list: T_ID[]) {
    if (!this.test) return;
    try {
      for (let j = 1, i = 1; j <= category_id_list.length; j++) {
        for (let x = 0; x < 2; x++, i+=2) {
          await this.add_item({ 
            category_id: category_id_list[j - 1],  
            name_am: `name_am_${i}`,
            name_ru: `name_ru_${i}`,
            variants: [
              {
                available: 1,
                color_am: `color_am_${i}`,
                color_ru: `color_ru_${i}`,
                description_am: `description_am_${i}`,
                description_ru: `description_ru_${i}`,
                min_order_unit: "box",
                min_order_value: i,
                price: 100 * i,
                promo: i === 1 ? null : 50 * i,
                size_unit: "num",
                size_value: i,
                special_group: i === 1 ? "prm" : null,
                src: [valid_photo_src, valid_photo_src]
              }
            ]
          });
        }
        i = j + 1;
      }
      const { rows } = await db.query("SELECT id FROM item_tbl ORDER BY name_am;");
      return rows.map(r => r.id) as string[];
    } catch (error) {
      error_logger("db -> item-methods -> populate_item_tbl\n", error);
      return new Db_Error_Response(error);
    }
  }

  async clear_item_tbl() {
    if (!this.test) return;
    try {
      await db.query("DELETE FROM item_tbl;");
    } catch (error) {
      error_logger("db -> item-methods -> clear_item_tbl\n", error);
      return new Db_Error_Response(error);
    }
  }
}

const item_methods = new Item_Methods();

export default item_methods;