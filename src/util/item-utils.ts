import { Pool } from "pg";
import { T_ID, T_Item_Body_Variant, T_Item_Body_Variant_Delete, T_Item_Body_Variant_Edit, T_Min_Order_Unit, T_Size_Unit, T_Special_Group } from "../types";

const valid_size_units: T_Size_Unit[] = ["mm", "cm", "m"];
const valid_min_order_units: T_Min_Order_Unit[] = ["box", "cm", "pcs", "roll"];
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
  if (!photo_src) return "Լուսանկարը բացակայում է";
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

export function check_photo_id(photo_id: any) {
  if (!photo_id) return "photo_id not provided";
  if (typeof photo_id !== "string") return `typeof photo_id is ${typeof photo_id}`;
  return null;
}

export function check_size_id(size_id: any) {
  if (!size_id) return "size_id not provided";
  if (typeof size_id !== "string") return `typeof size_id is ${typeof size_id}`;
  return null;
}

export function check_color_id(color_id: any) {
  if (!color_id) return "color_id not provided";
  if (typeof color_id !== "string") return `typeof color_id is ${typeof color_id}`;
  return null;
}

export async function create_item_variant(item_id: string, variant: T_Item_Body_Variant, db: Pool) {
  const photo_id = (await db.query(
    `
      INSERT INTO 
      item_photo_tbl(item_id, src)
      VALUES($1, $2)
      RETURNING id;
    `,
    [item_id, variant.src]
  )).rows[0].id as T_ID;

  const size_id = (await db.query(
    `
      INSERT INTO 
      item_size_tbl(size_value, size_unit, item_id)
      VALUES($1, $2, $3)
      RETURNING id;
    `,
    [variant.size_value, variant.size_unit, item_id]
  )).rows[0].id as T_ID;

  const color_id = (await db.query(
    `
      INSERT INTO 
      item_color_tbl(color_am, color_ru, item_id)
      VALUES($1, $2, $3)
      RETURNING id;
    `,
    [variant.color_am, variant.color_ru, item_id]
  )).rows[0].id as T_ID;

  await db.query(
    `
      INSERT INTO item_info_tbl
      (
        price,
        promo,
        min_order_value,
        min_order_unit,
        description_am,
        description_ru,
        special_group,
        available,
        item_id,
        size_id,
        color_id,
        photo_id
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
    `,
    [
      variant.price, 
      variant.promo, 
      variant.min_order_value, 
      variant.min_order_unit, 
      variant.description_am, 
      variant.description_ru,
      variant.special_group,
      variant.available,
      item_id,
      size_id,
      color_id,
      photo_id
    ]
  );
}

export async function edit_item_variant(variant: T_Item_Body_Variant_Edit, db: Pool) {
  await db.query(
    `
      UPDATE item_photo_tbl
      SET src = $1
      WHERE id = $2;
    `,
    [variant.src, variant.photo_id]
  );

  await db.query(
    `
      UPDATE item_size_tbl
      SET size_value = $1,
          size_unit = $2
      WHERE id = $3;
    `,
    [variant.size_value, variant.size_unit, variant.size_id]
  );

  await db.query(
    `
      UPDATE item_color_tbl
      SET color_am = $1,
          color_ru = $2
      WHERE id = $3;
    `,
    [variant.color_am, variant.color_ru, variant.color_id]
  );

  await db.query(
    `
      UPDATE item_info_tbl
      SET price = $1,
          promo = $2,
          min_order_value = $3,
          min_order_unit = $4,
          description_am = $5,
          description_ru = $6,
          special_group = $7,
          available = $8
      WHERE photo_id = $9;
    `,
    [
      variant.price, 
      variant.promo, 
      variant.min_order_value, 
      variant.min_order_unit, 
      variant.description_am, 
      variant.description_ru,
      variant.special_group,
      variant.available,
      variant.photo_id
    ]
  );
}

export async function delete_item_variant({ color_id, photo_id, size_id }: T_Item_Body_Variant_Delete, db: Pool) {
  await db.query(
    `
      DELETE FROM item_info_tbl
      WHERE photo_id = $1;
    `,
    [photo_id]
  );

  await db.query(
    `
      DELETE FROM item_photo_tbl
      WHERE id = $1;
    `,
    [photo_id]
  );

  await db.query(
    `
      DELETE FROM item_color_tbl
      WHERE id = $1;
    `,
    [color_id]
  );

  await db.query(
    `
      DELETE FROM item_size_tbl
      WHERE id = $1;
    `,
    [size_id]
  );
}