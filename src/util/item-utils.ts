import { Pool } from "pg";
import { T_ID, T_Item_Body_Variant, T_Item_Body_Variant_Delete, T_Item_Body_Variant_Edit, T_Min_Order_Unit, T_Size_Unit, T_Special_Group } from "../types";

const valid_size_units: T_Size_Unit[] = ["mm", "cm", "m", "num"];
const valid_min_order_units: T_Min_Order_Unit[] = ["box", "cm", "pcs", "roll", "m"];
const valid_special_group: (T_Special_Group | null)[] = ["new", "prm", "liq", null];

export function check_category(category_id: T_ID) {
  if (!category_id) return "category_id not provided";
  if (typeof category_id !== "string") return `typeof category_id is ${typeof category_id}`;
  return null;
}

export function check_name(name_am: string, name_ru: string) {
  if (!name_am) return "Հայերեն անվանումը նշված չէ"; 
  if (!name_ru) return "Ռուսերեն անվանումը նշված չէ"; 
  if (typeof name_am !== "string") return `typeof name_am is ${typeof name_am}`;
  if (typeof name_ru !== "string") return `typeof name_ru is ${typeof name_ru}`;
  const name_am_trimmed = name_am.trim();
  const name_ru_trimmed = name_ru.trim();
  if (name_am_trimmed.length < 1) return "Հայերեն անվանումը նշված չէ";
  if (name_ru_trimmed.length < 1) return "Ռուսերեն անվանումը նշված չէ";
  return null;
}

export function check_price(price: number) {
  if (typeof price !== "number" || isNaN(price)) return `typeof price is ${isNaN(price) ? "NaN" : typeof price}`;
  if (price <= 0) return "Գինը պետք է լինի 0-ից մեծ արժեք";

  return null;
}

export function check_promo(promo: number | null) {
  if (typeof promo !== "number" || isNaN(promo)) {
    if (promo !== null) return `typeof promo is ${isNaN(promo) ? "NaN" : typeof promo}`;
    return null;
  }
  if (promo <= 0) return "Ակցիան կամ պետք է լինի անջատված կամ 0-ից մեծ արժեք";
  return null;
}

export function check_size(size_value: number, size_unit: T_Size_Unit) {
  if (typeof size_value !== "number" || isNaN(size_value)) return `typeof size_value is ${isNaN(size_value) ? "NaN" : typeof size_value}`;
  if (size_value < 0) return "Չափի արժեքը պետք է լինի 0 և մեծ արժեք";
  if (typeof size_unit !== "string") return `typeof size_unit is ${typeof size_unit}`;
  if (!valid_size_units.includes(size_unit)) return `invalid size_unit: ${size_unit}`;
  return null;
}

export function check_color(color_am: string, color_ru: string) {
  if (!color_am) return "Գույնի հայերեն անվանումը նշված չէ"; 
  if (!color_ru) return "Գույնի ռուսերեն անվանումը նշված չէ"; 
  if (typeof color_am !== "string") return `typeof color_am is ${typeof color_am}`;
  if (typeof color_ru !== "string") return `typeof color_ru is ${typeof color_ru}`;
  const color_am_trimmed = color_am.trim();
  const color_ru_trimmed = color_ru.trim();
  if (color_am_trimmed.length < 1) return "Գույնի հայերեն անվանումը նշված չէ";
  if (color_ru_trimmed.length < 1) return "Գույնի ռուսերեն անվանումը նշված չէ";
  return null;
}

export function check_min_order(min_order_value: number, min_order_unit: T_Min_Order_Unit) {
  if (typeof min_order_value !== "number" || isNaN(min_order_value)) return `typeof min_order_value is ${isNaN(min_order_value) ? "NaN" : typeof min_order_value}`;
  if (min_order_value <= 0) return "Նվազագույն պատվերի արժեքը պետք է լինի 0-ից մեծ արժեք";
  if (!min_order_unit) return "Նվազագույն պատվերի միավորը նշված չէ";
  if (typeof min_order_unit !== "string") return `typeof min_order_unit is ${typeof min_order_unit}`;
  if (!valid_min_order_units.includes(min_order_unit)) return `invalid min_order_unit: ${min_order_unit}`;
  return null
}

export function check_description(description_am: string | null, description_ru: string | null) {
  if (typeof description_am !== "string" && description_am !== null) return `typeof description_am is ${typeof description_am}`;
  if (typeof description_ru !== "string" && description_ru !== null) return `typeof description_ru is ${typeof description_ru}`;
  return null;
}

export function check_photo(photo_src: string[]) {
  if (!photo_src || photo_src.length < 1 || !Array.isArray(photo_src)) return "Լուսանկարը բացակայում է";
  let index = 0;
  for (let src of photo_src) {
    if (typeof src !== "string") return `typeof photo_src is ${typeof src}; index = ${index}`;
    if (src.length < 20) return `Wrong photo data; index = ${index}`;
    index++;
  }
  return null; 
}

export function check_special_group(special_group: T_Special_Group | null) {
  if (!valid_special_group.includes(special_group)) return "Wrong special group";
  return null;
}

export function check_available(available: number) {
  if (typeof available !== "number" || isNaN(available)) return `typeof available is ${isNaN(available) ? "NaN" : typeof available}`;
  if (available < 0) return "Հասանելի քանակությունը պետք է լինի 0 կամ մեծ արժեք";
  return null;
}

export function check_photo_id(photo_id: any) {
  if (typeof photo_id !== "string") return `typeof photo_id is ${typeof photo_id}`;
  if (photo_id.length < 1) return "photo_id not provided";
  return null;
}

export function check_size_id(size_id: any) {
  if (typeof size_id !== "string") return `typeof size_id is ${typeof size_id}`;
  if (size_id.length < 1) return "size_id not provided";
  return null;
}

export function check_color_id(color_id: any) {
  if (typeof color_id !== "string") return `typeof color_id is ${typeof color_id}`;
  if (color_id.length < 1) return "color_id not provided";
  return null;
}