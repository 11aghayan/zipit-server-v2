import { T_Controller, T_Filters, T_Lang } from "../types";
import { custom_error } from "../util/error_handlers";

const valid_sorting_keys = ["name", "price", "time"];
const valid_sorting_directions = ["asc", "desc"];

function get_sorting_name(key: string, lang: T_Lang) {
  switch(key) {
    case 'name':
      return `name_${lang}`;
    case 'time':
      return 'creation_time';
    
    default: 
      return 'price';
  }
}

export const filter_items: T_Controller = function(req, _res, next) {
  const { special_groups, categories, count } = req.query as { special_groups?: string, categories?: string, count?: string };
  
  req.body.filters = {
    special_groups: special_groups ? special_groups.split(",") : null,
    categories: categories ? categories.split(",") : null,
    count: count ? Number(count) : 25
  } as T_Filters;

  next();
}

export const get_user_sorting: T_Controller = function(req, res, next) {
  const { sortby, lang } = req.query as { sortby?: string, lang: T_Lang };
  
  const default_sorting = 'creation_date ASC';
  
  if (!sortby) {
    req.body.sorting = default_sorting;
    return next();
  };
  
  let [key, direction] = sortby.split("_");

  if (!valid_sorting_keys.includes((key).toLowerCase())) {
    return custom_error(res, 400, "Invalid sorting key");
  }
  
  if (!valid_sorting_directions.includes(direction.toLowerCase())) {
    return custom_error(res, 400, "Invalid sorting direction");
  }
  
  const name = get_sorting_name(key, lang); 
  const dir = direction.toUpperCase();
  
  req.body.sorting = `${name} ${dir}`;
  next();
  
}

export const get_suggestion_sorting: T_Controller = function(req, _res, next) {
  req.body.sorting = `
    CASE special_group
        WHEN 'liq' THEN 1
        WHEN 'promo' THEN 2
        WHEN 'new' THEN 3
        ELSE 4
    END
  `;
  req.body.filters = {
    special_groups: null,
    categories: null,
    count: 10
  };
  next();
}

export function get_similar_sorting() {

}