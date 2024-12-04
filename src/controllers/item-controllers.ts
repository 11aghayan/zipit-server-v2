import * as Db from "../db/db";
import { T_Controller, T_Filters, T_Item_Public_Common, T_Item_Public_Full, T_Item_Public_Full_Response, T_Lang } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export const get_all_items_public: T_Controller = async function(req, res) {
  const { filters, sorting } = req.body as { filters: T_Filters; sorting: string };
  const lang = req.query.lang as T_Lang;

  try {
    const items = await Db.get_all_items_public(filters, sorting, lang);
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Items fetching error");
    }
    return res.status(200).json({ items: items.rows, items_count: items.rows.length });
  } catch (error) {
    return server_error(res, "get_all_items_public", error);
  }
}

export const get_item_public: T_Controller = async function(req, res) {
  const { id } = req.params;
  const lang = req.query.lang as T_Lang;
  try {
    const item = await Db.get_item_public(id, lang);
    if (item instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Item fetching error");
    }

    const response = item.rows.reduce((prev: T_Item_Public_Full_Response, current: T_Item_Public_Full) => {
      const obj = {} as T_Item_Public_Common;
      const common_keys = ["id", "category_id", "category", "name"] as (keyof T_Item_Public_Common)[];
      const variant = JSON.parse(JSON.stringify(current));
      common_keys.forEach((key: keyof T_Item_Public_Common) => {
        obj[key] = current[key];
        delete variant[key];
      });
      return {
        ...obj,
        variants: [
          ...prev.variants,
          variant
        ]
      };
    }, { id: '', category_id: '', category: '', name: '', variants: [] } as T_Item_Public_Full_Response) as T_Item_Public_Full_Response;
    
    return res.status(200).json({ item: response, variants: response.variants.length });
  } catch (error) {
    return server_error(res, "get_item_public", error);
  }
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