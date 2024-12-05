import { T_Controller, T_Item_Body, T_Item_Body_Edit } from "../types";
import { custom_error } from "../util/error_handlers";
import { check_available, check_category, check_color, check_color_id, check_description, check_min_order, check_name, check_photo, check_photo_id, check_price, check_promo, check_size, check_size_id, check_special_group } from "../util/item-utils";

const valid_langs = ["am", "ru"];

export const check_lang: T_Controller = function(req, res, next) {
  const { lang } = req.query as { lang?: string };

  if (!lang || !valid_langs.includes(lang)) {
    return custom_error(res, 400, `lang must be either am or ru, you provided ${lang}`);
  }
  next();
};

export const check_item_body: T_Controller = function(req, res, next) {
  const { 
    category_id,
    name_am,
    name_ru,
    variants    
  } = req.body as T_Item_Body;
  
  const category_error = check_category(category_id);
  if (category_error) return custom_error(res, 400, category_error);
  
  const name_error = check_name(name_am, name_ru);
  if (name_error) return custom_error(res, 400, name_error);

  if (!Array.isArray(variants)) return custom_error(res, 400, "variants is not iterable");
  if (variants.length < 1) return custom_error(res, 400, "Ապրանքը պետք է ունենա առնվազն մեկ տարբերակ");
  
  for (let {
    available, 
    color_am, 
    color_ru,
    description_am,
    description_ru,
    min_order_unit,
    min_order_value, 
    photo_src,
    price,
    promo,
    size_unit,
    size_value,
    special_group
  } of variants) {
    const price_error = check_price(price);
    if (price_error) return custom_error(res, 400, price_error);

    const promo_error = check_promo(promo);
    if (promo_error) return custom_error(res, 400, promo_error);
    
    const size_error = check_size(size_value, size_unit);
    if (size_error) return custom_error(res, 400, size_error);
    
    const color_error = check_color(color_am, color_ru);
    if (color_error) return custom_error(res, 400, color_error);

    const min_order_error = check_min_order(min_order_value, min_order_unit);
    if (min_order_error) return custom_error(res, 400, min_order_error);
    
    const description_error = check_description(description_am, description_ru);
    if (description_error) return custom_error(res, 400, description_error);

    const photo_error = check_photo(photo_src);
    if (photo_error) return custom_error(res, 400, photo_error);

    const special_group_error = check_special_group(special_group);
    if (special_group_error) return custom_error(res, 400, special_group_error);

    const available_error = check_available(available);
    if (available_error) return custom_error(res, 400, available_error);
  }
  
  next();
}

export const check_item_fk_ids: T_Controller = function(req, res, next) {
  const { variants } = req.body as T_Item_Body_Edit;

  if (!Array.isArray(variants)) return custom_error(res, 400, "variants is not iterable");
  if (variants.length < 1) return custom_error(res, 400, "Ապրանքը պետք է ունենա առնվազն մեկ տարբերակ");
  
  for (let { photo_id, size_id, color_id } of variants) {
    const photo_id_error = check_photo_id(photo_id);
    if (photo_id_error) return custom_error(res, 400, photo_id_error);

    const size_id_error = check_size_id(size_id);
    if (size_id_error) return custom_error(res, 400, size_id_error);

    const color_id_error = check_color_id(color_id);
    if (color_id_error) return custom_error(res, 400, color_id_error);
  }
  
  next();
}

export const check_photo_sizes: T_Controller = function(req, res, next) {
  const { width, height } = req.query;
  if (!width) return custom_error(res, 400, "Image width not provided");
  if (!height) return custom_error(res, 400, "Image height not provided");
  
  const num_width = Number(width);
  const num_height = Number(height);
  
  if (isNaN(num_width)) return custom_error(res, 400, "Image width must be a numeric value");
  if (isNaN(num_height)) return custom_error(res, 400, "Image height must be a numeric value");
  if (num_width < 1) return custom_error(res, 400, "Image width must be value greater than or equal to 1");
  if (num_height < 1) return custom_error(res, 400, "Image height must be value greater than or equal to 1");

  next();
}

export const check_query: T_Controller = function(req, res, next) {
  const { query, limit } = req.query;

  if (!query) return res.status(200).json({ length: 0, items: [] });
  if (typeof query !== "string") return custom_error(res, 400, `typeof query is ${typeof query}`);
  const query_trimmed = query.trim();
  if (query_trimmed.length < 1) return res.status(200).json({ length: 0, items: [] });
  const query_sliced = query_trimmed.slice(0, 100);
  req.query.query = `%${query_sliced}%`;

  if (
      !limit 
      || typeof(limit) !== "string" 
      || isNaN(Number(limit))
      || Number(limit) < 1
      || Number(limit) > 100
    ) req.query.limit = "10";

  req.query.limit = Math.trunc(Number(limit)).toString();
  
  next();
}

export function check_category_labels() {

}

export function check_if_category_empty() {
  
}

export function check_new_password() {
  
}