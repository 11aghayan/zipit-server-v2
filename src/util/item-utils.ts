import { T_ID, T_Min_Order_Unit, T_Size_Unit, T_Special_Group } from "../types";

const valid_size_units: T_Size_Unit[] = ["mm", "cm", "m", "num"];
const valid_min_order_units: T_Min_Order_Unit[] = ["box", "cm", "pcs", "roll", "m"];
const valid_special_group: (T_Special_Group | null)[] = ["new", "prm", "liq", null];

export function check_category(category_id: T_ID) {
  if (typeof category_id !== "string") return `typeof category_id is ${typeof category_id}`;
  const trimmed_category_id = category_id.trim();
  if (trimmed_category_id.length < 1) return "category_id not provided";
  return null;
}

export function check_name(name_am: string, name_ru: string) {
  if (typeof name_am !== "string") return `typeof name_am is ${typeof name_am}`;
  if (typeof name_ru !== "string") return `typeof name_ru is ${typeof name_ru}`;
  const name_am_trimmed = name_am.trim();
  const name_ru_trimmed = name_ru.trim();
  if (name_am_trimmed.length < 1) return "Հայերեն անվանումը նշված չէ";
  if (name_ru_trimmed.length < 1) return "Ռուսերեն անվանումը նշված չէ";
  return null;
}

export function check_price(price: number) {
  if (typeof price !== "number") return `typeof price is ${typeof price}`;
  if (price <= 0) return "Գինը պետք է լինի 0-ից մեծ արժեք";

  return null;
}

export function check_promo(promo: number | null) {
  if (promo === null) return null;
  if (typeof promo !== "number") {
    return `typeof promo is ${typeof promo}`;
  }
  if (promo < 0) return "Ակցիան պետք է լինի 0 կամ 0-ից մեծ արժեք";
  return null;
}

export function check_size(size_value: number, size_unit: T_Size_Unit) {
  if (typeof size_value !== "number") return `typeof size_value is ${typeof size_value}`;
  if (size_value < 0) return "Չափի արժեքը պետք է լինի 0 և մեծ արժեք";
  if (typeof size_unit !== "string") return `typeof size_unit is ${typeof size_unit}`;
  if (!valid_size_units.includes(size_unit)) return `invalid size_unit: ${size_unit}`;
  return null;
}

export function check_color(color_am: string, color_ru: string) {
  if (typeof color_am !== "string") return `typeof color_am is ${typeof color_am}`;
  if (typeof color_ru !== "string") return `typeof color_ru is ${typeof color_ru}`;
  const color_am_trimmed = color_am.trim();
  const color_ru_trimmed = color_ru.trim();
  if (color_am_trimmed.length < 1) return "Գույնի հայերեն անվանումը նշված չէ";
  if (color_ru_trimmed.length < 1) return "Գույնի ռուսերեն անվանումը նշված չէ";
  return null;
}

export function check_min_order(min_order_value: number, min_order_unit: T_Min_Order_Unit) {
  if (typeof min_order_value !== "number") return `typeof min_order_value is ${typeof min_order_value}`;
  if (min_order_value <= 0) return "Նվազագույն պատվերի արժեքը պետք է լինի 0-ից մեծ արժեք";
  if (typeof min_order_unit !== "string") return `typeof min_order_unit is ${typeof min_order_unit}`;
  if (!valid_min_order_units.includes(min_order_unit)) return `invalid min_order_unit: ${min_order_unit}`;
  return null
}

export function check_description(description_am: string | null, description_ru: string | null) {
  if (typeof description_am !== "string" && description_am !== null) return `typeof description_am is ${typeof description_am}`;
  if (typeof description_ru !== "string" && description_ru !== null) return `typeof description_ru is ${typeof description_ru}`;
  return null;
}

export function check_item_code(item_code: string | null) {
    if (typeof item_code != "string") return `typeof item_code is ${typeof item_code}`;
    const trimmed_code = item_code.trim();
    if (trimmed_code.length == 0) return "Ապրանքի կոդը նշված չէ";
    if (trimmed_code.length > 50) return "Ապրանքի կոդը պետք է լինի առավելագույնը 50 նիշ";
    return null;
}

export function check_photo(photo_src: string[]) {
  if (!Array.isArray(photo_src) || photo_src.length < 1) return "Լուսանկարը բացակայում է";
  let index = 0;
  for (let src of photo_src) {
    if (typeof src !== "string") return `typeof photo_src is ${typeof src}; index = ${index}`;
    if (src.length < 20 || !src.startsWith("data:image/")) return `Wrong photo data; index = ${index}`;
    index++;
  }
  return null; 
}

export function check_special_group(special_group: T_Special_Group | null) {
  if (!valid_special_group.includes(special_group)) return "Wrong special group";
  return null;
}

export function check_available(available: number) {
  if (typeof available !== "number") return `typeof available is ${typeof available}`;
  if (available < 0) return "Հասանելի քանակությունը պետք է լինի 0 կամ մեծ արժեք";
  return null;
}

export function check_photo_id(photo_id: any) {
  if (typeof photo_id !== "string") return `typeof photo_id is ${typeof photo_id}`;
  const photo_id_trimmed = photo_id.trim();
  if (photo_id_trimmed.length < 1) return "photo_id not provided";
  return null;
}

export function check_size_id(size_id: any) {
  if (typeof size_id !== "string") return `typeof size_id is ${typeof size_id}`;
  const size_id_trimmed = size_id.trim();
  if (size_id_trimmed.length < 1) return "size_id not provided";
  return null;
}

export function check_color_id(color_id: any) {
  if (typeof color_id !== "string") return `typeof color_id is ${typeof color_id}`;
  const color_id_trimmed = color_id.trim();
  if (color_id_trimmed.length < 1) return "color_id not provided";
  return null;
}