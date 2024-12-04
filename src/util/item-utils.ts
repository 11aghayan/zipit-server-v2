import { T_ID, T_Min_Order_Unit, T_Size_Unit, T_Special_Group } from "../types";

const valid_size_units: T_Size_Unit[] = ["mm", "cm", "m"];
const valid_min_order_units: T_Min_Order_Unit[] = ["box", "cm", "pcs", "roll"];
const valid_special_group: (T_Special_Group | null)[] = ["new", "prm", "liq", null];

export function check_category(category_id: T_ID) {
  if (!category_id) return "category_id not provided";
  return null;
}

export function check_name(name_am: string, name_ru: string) {
  if (!name_am) return "Հայերեն անվանումը նշված չէ"; 
  if (!name_ru) return "Ռուսերեն անվանումը նշված չէ"; 
  if (typeof name_am !== "string") return `typeof name_am is ${typeof name_am}`;
  if (typeof name_ru !== "string") return `typeof name_ru is ${typeof name_ru}`;
  return null;
}

export function check_price(price: number) {
  if (!price) return "Գինը նշված չէ";
  if (typeof price !== "number") return `typeof price is ${typeof price}`;
  if (price <= 0) return "Գինը պետք է լինի 0-ից մեծ արժեք";

  return null;
}

export function check_promo(promo: number | null) {
  if (typeof promo !== "number") {
    if (promo !== null) return `typeof promo is ${typeof promo}`;
    return null;
  }
  if (promo <= 0) return "Ակցիան կամ պետք է լինի անջատված կամ 0-ից մեծ արժեք";
  return null;
}

export function check_size(size_value: number, size_unit: T_Size_Unit) {
  if (!size_value) return "Չափի արժեքը նշված չէ";
  if (typeof size_value !== "number") return `typeof size_value is ${typeof size_value}`;
  if (size_value <= 0) return "Չափի արժեքը պետք է լինի 0-ից մեծ արժեք";
  if (!size_unit) return "Չափի միավորը նշված չէ";
  if (typeof size_unit !== "string") return `typeof size_unit is ${typeof size_unit}`;
  if (!valid_size_units.includes(size_unit)) return `invalid size_unit: ${size_unit}`;
  return null;
}

export function check_color(color_am: string, color_ru: string) {
  if (!color_am) return "Հայերեն գույնի անվանումը նշված չէ"; 
  if (!color_ru) return "Ռուսերեն գույնի անվանումը նշված չէ"; 
  if (typeof color_am !== "string") return `typeof color_am is ${typeof color_am}`;
  if (typeof color_ru !== "string") return `typeof color_ru is ${typeof color_ru}`;
  return null;
}

export function check_min_order(min_order_value: number, min_order_unit: T_Min_Order_Unit) {
  if (!min_order_value) return "Նվազագույն պատվերի արժեքը նշված չէ";
  if (typeof min_order_value !== "number") return `typeof min_order_value is ${typeof min_order_value}`;
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

export function check_photo(photo_src: string) {
  if (!photo_src) return "Լուսանկարը տեղադրված չէ";
  if (typeof photo_src !== "string") return `typeof photo_src is ${typeof photo_src}`;
  if (photo_src.length < 20) return "Wrong photo data";
  return null; 
}

export function check_special_group(special_group: T_Special_Group | null) {
  if (!valid_special_group.includes(special_group)) return "Wrong special group";
  return null;
}

export function check_available(available: number) {
  if (typeof available !== "number") return `typeof available is ${typeof available}`;
  if (available < 0) return "Հասանելի քանակությունը պետք է լինի 0-ից մեծ կամ հավասար արժեք";
  return null;
}