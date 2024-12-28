import { T_Controller, T_Filters, T_Lang } from "../types";
import { custom_error } from "../util/error_handlers";

const valid_sorting_keys = ["name", "price"];
const valid_sorting_directions = ["asc", "desc"];

const get_sorting_name = (key: string, lang: T_Lang) => key === "name" ? `name_${lang}` : "COALESCE(promo, price)";

export const filter_items: T_Controller = function(req, _res, next) {
  const { special_groups, categories, count = "25", page = "1", search } = req.query;
  
  const count_num_unchecked = Number(count);
  const page_num_unchecked = Number(page);
  
  const count_num = count_num_unchecked && !isNaN(count_num_unchecked) && count_num_unchecked > 0 ? count_num_unchecked : 25;
  const page_num = page_num_unchecked && !isNaN(page_num_unchecked) && page_num_unchecked > 0 ? page_num_unchecked : 1;
  const offset = (page_num - 1) * count_num;
  
  req.body.filters = {
    special_groups: special_groups && typeof special_groups === "string" ? special_groups.split(",") : null,
    categories: categories && typeof categories === "string" ? categories.split(",") : null,
    count: count_num,
    offset,
    search: typeof search === "string" && search.length > 0 ? `%${search}%` : null
  } as T_Filters;

  next();
}

export const get_user_sorting: T_Controller = function(req, res, next) {
  const { sortby, lang = "am" } = req.query as { sortby?: string, lang: T_Lang };
  
  const default_sorting = `name_${lang}`;
  
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
  
  req.body.sorting = `${name} ${dir} NULLS LAST`;
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
    count: 10,
    offset: 0
  };
  next();
}

export const get_photo_src_index: T_Controller = function(req, _res, next) {
  const { index } = req.query;
  const num_index = Number(index);
  if (!index || isNaN(num_index) || num_index < 1) {
    req.query.index = "1"; 
  }
  next();
}