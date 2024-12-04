import * as db from "../db/db";
import { T_Controller, T_Filters, T_Lang } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export const get_all_items_public: T_Controller = async function(req, res) {
  const { filters, sorting } = req.body as { filters: T_Filters; sorting: string };
  const lang = req.query.lang as T_Lang;

  try {
    const items = await db.get_all_items_public(filters, sorting, lang);
    if (items instanceof db.DB_Error_Response) {
      return custom_error(res, 500, "Items fetching error. Try Again");
    }
    return res.status(200).json({ items: items.rows, items_count: items.rows.length });
  } catch (error) {
    return server_error(res, "get_all_items_public", error);
  }
}

export async function get_item_public() {
  
}

export async function get_all_items_admin() {

}

export async function get_item_admin() {

} 

export const add_item = async function() {
  
  try {
    
  } catch (error) {
    
  }
}

export async function edit_item() {

}

export async function delete_item() {

}