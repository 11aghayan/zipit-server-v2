import * as Db from "../db/db";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export async function get_categories_and_item_qty() {
  
}

export const get_categories_full: T_Controller = async function(req, res) {
  try {
    const categories = await Db.get_categories_full();
    if (categories instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Categories fetching error");
    }

    return res.status(200).json({ length: categories.rows.length, categories: categories.rows });
  } catch (error) {
    return server_error(res, "get_categories_full", error);
  }
}

export async function add_category() {
  
}

export async function edit_category() {
  
}

export async function delete_category() {
  
}