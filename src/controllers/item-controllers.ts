import * as Db from "../db";
import { T_Cart_Item_Request, T_Controller, T_Filters, T_ID, T_Item_Admin_Common, T_Item_Admin_Full, T_Item_Admin_Full_Response, T_Item_Body, T_Item_Body_Edit, T_Item_Public_Common, T_Item_Public_Full, T_Item_Public_Full_Response, T_Lang, T_Size_Unit, T_Special_Group } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export const get_all_items_public: T_Controller = async function(req, res) {
  const { filters, sorting } = req.body as { filters: T_Filters; sorting: string };
  const lang = req.query.lang as T_Lang;

  try {
    const items = await Db.get_all_items_public(filters, sorting, lang);
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Items fetching error");
    }
    
    return res.status(200).json({ items_count: items.rows.length, pages: Math.ceil(Number(items.rows[0]?.count || 0) / filters.count), items: items.rows });
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
    
    return res.status(200).json({ variants: response.variants.length, item: response });
  } catch (error) {
    return server_error(res, "get_item_public", error);
  }
}

export const get_similar_items: T_Controller = async function(req, res) {
  let { item_id, category_id, special_group = null, size_unit, lang } = req.query as { category_id: T_ID, special_group: string | undefined, size_unit: T_Size_Unit, item_id: T_ID, lang: T_Lang };
  if (!item_id) return custom_error(res, 400, "No Item ID");
  if (!category_id) return custom_error(res, 400, "No category ID");
  if (!size_unit) return custom_error(res, 400, "No size unit");
  special_group = special_group === "null" || special_group === "undefined" ? null : special_group;
  
  try {
    const items = await Db.get_similar_items(item_id, category_id, special_group as T_Special_Group, size_unit, 10, lang);
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Item fetching error");
    }

    return res.status(200).json({ items_count: items.rows.length, items: items.rows });
  } catch (error) {
    return server_error(res, "get_similar_items", error);
  }
}

export const get_all_items_admin: T_Controller = async function(req, res) {
  const { filters, sorting } = req.body as { filters: T_Filters; sorting: string };

  try {
    const items = await Db.get_all_items_admin(filters, sorting);
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Items fetching error");
    }
    
    return res.status(200).json({ length: items.rows.length, pages: Math.ceil(Number(items.rows[0]?.count || 0) / filters.count), items: items.rows });
  } catch (error) {
    return server_error(res, "get_all_items_admin", error);
  }
}

export const get_item_admin: T_Controller = async function(req, res) {
  const { id } = req.params;
  
  try {
    const item = await Db.get_item_admin(id);
    if (item instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Item fetching error");
    }    

    if (item.rows.length < 1) return custom_error(res, 404, "No items found"); 
    
    const response = item.rows.reduce((prev: T_Item_Admin_Full_Response, current: T_Item_Admin_Full) => {
      const obj = {} as T_Item_Admin_Common;
      const common_keys = ["id", "category_id", "name_am", "name_ru"] as (keyof T_Item_Admin_Common)[];
      const variant = JSON.parse(JSON.stringify(current));
      common_keys.forEach((key: keyof T_Item_Admin_Common) => {
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
    }, { id: '', category_id: '', category_label_am: '', category_label_ru: '', name_ru: '', name_am: '', variants: [] } as T_Item_Admin_Full_Response) as T_Item_Admin_Full_Response;
    
    return res.status(200).json({ item: response })
  } catch (error) {
    return server_error(res, "get_similar_items", error);
  }
} 

export const add_item: T_Controller = async function(req, res, next) {
  const { body } = req as { body: T_Item_Body };
  
  try {
    const response = await Db.add_item(body);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Item adding error");
    }

    const id = response.rows[0];
    req.params.id = id;
    return await get_item_admin(req, res, next);
  } catch (error) {
    return server_error(res, "add_item", error);
  }
}

export const edit_item: T_Controller = async function(req, res, next) {
  const { body } = req as { body: T_Item_Body_Edit };
  const { id } = req.params as { id: T_ID };
  
  try {
    const response = await Db.edit_item({ ...body, id });
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Item editing error");
    }

    return await get_item_admin(req, res, next);
  } catch (error) {
    return server_error(res, "edit_item", error);
  }
}

export const delete_item: T_Controller = async function(req, res) {
  const { id } = req.params;
  try {
    const response = await Db.delete_item(id);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Item deleting error");
    }
    return res.sendStatus(200);
  } catch (error) {
    return server_error(res, "delete_item", error);
  }
}

export const get_matching_items: T_Controller = async function(req, res) {
  const { query, lang, limit } = req.query as { query: string, lang: T_Lang, limit: string };
  
  try {
    const items = await Db.get_matching_items(query, lang, Number(limit));
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Items fetching error");
    }

    return res.status(200).json({ length: items.rows.length, items: items.rows });
  } catch (error) {
    return server_error(res, "get_matching_items", error);
  }
}

export const get_cart_items: T_Controller = async function(req, res) {
  const { lang } = req.query;
  const { items } = req.body as { items: T_Cart_Item_Request[] };
  
  try {
    const response = await Db.get_cart_items(items, lang as T_Lang);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Items fetching error");
    }
    return res.status(200).json({ items_count: response.rows.length, pages: 1, items: response.rows });
  } catch (error) {
    return server_error(res, "get_cart_items", error);
  }
}

