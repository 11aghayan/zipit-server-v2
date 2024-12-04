import { Request, Response, NextFunction } from "express";

type T_ID = string;

export type T_Controller = (req: Request, res: Response, next: NextFunction) => any;
export type T_Lang = 'am' | 'ru';
export type T_Size_Unit = "mm" | "cm" | "m";
export type T_Min_Order_Unit = "pcs" | "cm" | "box" | "roll";
export type T_Special_Group = "new" | "prm" | "liq";

export type T_User = {
  id: T_ID;
  username: string;
  password_hash: string;
  refresh_token: string | null;
};

export type T_Category = {
  id: T_ID;
  label_am: string;
  label_ru: string;
};

export type T_Item = {
  id: T_ID;
  category_id: T_ID;
  name_am: string;
  name_ru: string;
};

export type T_Photo = {
  id: T_ID;
  item_id: T_ID;
  src: string;
};

export type T_Size = {
  id: T_ID;
  size_value: number;
  size_unit: T_Size_Unit;
};

export type T_Color = {
  id: T_ID;
  color_am: string;
  color_ru: string;
};

export type T_Item_Info = {
  item_id: T_ID;
  photo_id: T_ID;
  price: number;
  promo: number | null;
  size_id: T_ID;
  color_id: T_ID;
  min_order_value: number;
  min_order_unit: T_Min_Order_Unit;
  description_am: string | null;
  description_ru: string | null;
  special_group: T_Special_Group | null;
  creation_date: number;
  available: number;
};

export type T_Filters = {
  special_groups: string[] | null;
  categories: string[] | null;
  count: number;
};

export type T_Item_Public_Short = {
  id: T_ID;
  name_ru: string;
  photo_id: T_ID;
  price: number;
  promo: number | null;
  special_group: T_Special_Group | null;
  size_value: number;
  size_unit: T_Size_Unit;
  color_ru: string;
};

export type T_Item_Public_Common = {
  id: T_ID;
  category_id: T_ID;
  category: string;
  name: string;
};

export type T_Item_Public_Variant = {
  photo_id: T_ID;
  price: number;
  promo: number | null;
  size_id: T_ID;
  size_value: number;
  size_unit: T_Size_Unit;
  color_id: T_ID;
  color: string;
  min_order_value: number;
  min_order_unit: T_Min_Order_Unit;
  description: string;
  special_group: T_Special_Group | null;
  available: number;
};

export type T_Item_Public_Full = T_Item_Public_Common & T_Item_Public_Variant;

export type T_Item_Public_Full_Response = T_Item_Public_Common & {
  variants: T_Item_Public_Variant[];
};