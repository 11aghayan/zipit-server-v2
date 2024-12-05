import * as Db from "../db/db";
import { T_Controller, T_Lang } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export const get_categories_public: T_Controller = async function(req, res) {
  const { lang } = req.query as { lang: T_Lang };
  
  try {
    const categories = await Db.get_categories_public(lang);
    if (categories instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Categories fetching error");
    }

    return res.status(200).json({ length: categories.rows.length, categories: categories.rows });
  } catch (error) {
    return server_error(res, "get_categories_public", error);
  }
}

export const get_categories_admin: T_Controller = async function(req, res) {
  try {
    const categories = await Db.get_categories_admin();
    if (categories instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Categories fetching error");
    }

    return res.status(200).json({ length: categories.rows.length, categories: categories.rows });
  } catch (error) {
    return server_error(res, "get_categories_admin", error);
  }
}

export async function add_category() {
  
}

export async function edit_category() {
  
}

export async function delete_category() {
  
}