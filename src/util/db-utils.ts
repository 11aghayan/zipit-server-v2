import { T_ID, T_Lang } from "../types";

export function short_items_keys(lang: T_Lang) {
  lang = lang !== "am" && lang !== "ru" ? "am" : lang;
  
  return `
    item_tbl.id, 
    name_${lang} as name,
    photo_id,
    price,
    promo,
    special_group,
    size_value,
    size_unit,
    color_${lang} as color
  `
}

export function remove_duplicates<T extends { id: T_ID }>(arr: T[]) {
  return arr.reduce((prev: T[], current: T) => {
    const id_exists = prev.find(obj => obj.id === current.id);
    if (id_exists) return prev;
    return [
      ...prev,
      current
    ];
  }, [] as T[]);
}