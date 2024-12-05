import * as Db from "../db";
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

export const add_category: T_Controller = async function(req, res) {
  const { label_am, label_ru } = req.body;

  try {
    const response = await Db.add_category(label_am, label_ru);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Category adding error");
    }
    
    return res.sendStatus(201);
  } catch (error) {
    return server_error(res, "add_category", error);
  }
}

export const edit_category: T_Controller = async function(req, res) {
  const { label_am, label_ru } = req.body;
  const { id } = req.params;
  
  try {
    const response = await Db.edit_category(id, label_am, label_ru);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Category editing error");
    }

    return res.sendStatus(200);
  } catch (error) {
    return server_error(res, "edit_category", error);
  }
}

export const delete_category: T_Controller = async function(req, res) {
  const { id } = req.params;
  
  try {
    const response = await Db.delete_category(id);

    if (typeof response === "string") {
      return custom_error(res, 400, response);
    }
    
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Category deletion error");
    }

    return res.sendStatus(200);
  } catch (error) {
    return server_error(res, "delete_category", error);
  }
}