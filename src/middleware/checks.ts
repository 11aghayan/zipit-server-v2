import { T_Controller, T_Item_Body } from "../types";
import { custom_error } from "../util/error_handlers";
import { check_available, check_category, check_color, check_description, check_min_order, check_name, check_photo, check_price, check_promo, check_size, check_special_group } from "../util/item-utils";

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

export function check_category_labels() {

}

export function check_if_category_empty() {
  
}

export function check_new_password() {
  
}