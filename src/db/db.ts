import { Pool } from "pg";
import { T_Filters, T_Item_Public_Short, T_Lang } from "../types";
import { error_logger } from "../util/error_handlers";

const {
  PG_USER: user,
  PG_HOST: host,
  PG_DATABASE: database,
  PG_PASSWORD: password
} = process.env;

const port = Number(process.env.PG_PORT ?? '5432');

export const db = new Pool({
  user,
  host,
  database,
  port,
  password
});

export async function get_all_items_public({ categories, special_groups, count }: T_Filters, sorting: string, lang: T_Lang) {
  try {
    const { rows } = await db.query(
      ` SELECT 
          item_id as id, 
          name_${lang},
          photo_id,
          price,
          promo,
          special_group,
          size_value,
          size_unit,
          color_${lang}
        FROM (
          SELECT *
            FROM item_tbl
          INNER JOIN item_info_tbl
          ON item_tbl.id = item_info_tbl.item_id
          INNER JOIN item_size_tbl
          ON item_info_tbl.size_id = item_size_tbl.id
          INNER JOIN item_color_tbl
          ON item_info_tbl.color_id = item_color_tbl.id
          )
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
    error_logger("db.get_all_items_public", error);
    return new DB_Error_Response(error);
  }
} 

// Response Constructors
export class Db_Success_Response<T> {
  rows: T[];
  error = false;
  
  constructor(rows: T[]) {
    this.rows = rows;
  }
}

export class DB_Error_Response {
  err: unknown;
  error = true;
  
  constructor(err: any) {
    this.err = err;
  }
}