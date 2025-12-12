import { T_Cart_Item_Request, T_Controller, T_Item_Body } from "../types";
import { custom_error } from "../util/error_handlers";
import { 
  check_available, 
  check_category, 
  check_color, 
  check_color_id, 
  check_description, 
  check_item_code, 
  check_min_order, 
  check_name, 
  check_photo, 
  check_photo_id, 
  check_price, 
  check_promo, 
  check_size, 
  check_size_id, 
  check_special_group } from "../util/item-utils";

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

  req.body = {
    ...req.body,
    name_am: name_am.trim(),
    name_ru: name_ru.trim()
  } as T_Item_Body;
  
  if (!Array.isArray(variants)) return custom_error(res, 400, "variants is not iterable");
  if (variants.length < 1) return custom_error(res, 400, "Ապրանքը պետք է ունենա առնվազն մեկ տարբերակ");
  if (variants.every(v => "delete" in v)) return custom_error(res, 400, "Ապրանքը պետք է ունենա առնվազն մեկ տարբերակ");
  
  let variant_index = 0;
  
  for (let variant of variants) {
    if ("photo_id" in variant || "size_id" in variant || "color_id" in variant) {
      if (!("photo_id" in variant)) return custom_error(res, 400, "typeof photo_id is undefined"); 
      if (!("size_id" in variant)) return custom_error(res, 400, "typeof size_id is undefined"); 
      if (!("color_id" in variant)) return custom_error(res, 400, "typeof color_id is undefined"); 
      const photo_id_error = check_photo_id(variant.photo_id);
      if (photo_id_error) return custom_error(res, 400, photo_id_error);

      const size_id_error = check_size_id(variant.size_id);
      if (size_id_error) return custom_error(res, 400, size_id_error);

      const color_id_error = check_color_id(variant.color_id);
      if (color_id_error) return custom_error(res, 400, color_id_error);
    }
    if ("delete" in variant) {
      variant_index++;
      continue;
    }
    
    const price_error = check_price(variant.price);
    if (price_error) return custom_error(res, 400, price_error);

    const promo_error = check_promo(variant.promo);
    if (promo_error) return custom_error(res, 400, promo_error);
    
    const size_error = check_size(variant.size_value, variant.size_unit);
    if (size_error) return custom_error(res, 400, size_error);
    
    const color_error = check_color(variant.color_am, variant.color_ru);
    if (color_error) return custom_error(res, 400, color_error);

    const min_order_error = check_min_order(variant.min_order_value, variant.min_order_unit);
    if (min_order_error) return custom_error(res, 400, min_order_error);
    
    const description_error = check_description(variant.description_am, variant.description_ru);
    if (description_error) return custom_error(res, 400, description_error);

    const item_code_error = check_item_code(variant.item_code);
    if (item_code_error) return custom_error(res, 400, item_code_error);

    req.body.variants[variant_index] = {
      ...req.body.variants[variant_index],
      color_am: variant.color_am.trim(),
      color_ru: variant.color_ru.trim(),
      description_am: variant.description_am?.trim() || null,
      description_ru: variant.description_ru?.trim() || null,
      item_code: variant.item_code?.trim()
    };

    const photo_error = check_photo(variant.src);
    if (photo_error) return custom_error(res, 400, photo_error);

    const special_group_error = check_special_group(variant.special_group);
    if (special_group_error) return custom_error(res, 400, special_group_error);

    if (variant.promo !== null && variant.special_group === null) {
      req.body.variants[variant_index].special_group = "prm";
    }

    if (variant.promo === null && variant.special_group === "prm") {
      req.body.variants[variant_index].special_group = null;
    }
    
    const available_error = check_available(variant.available);
    if (available_error) return custom_error(res, 400, available_error);

    variant_index++;
  }
  
  next();
}

export const check_photo_sizes: T_Controller = function(req, res, next) {
  const { width, height } = req.query as { width?: string, height?: string };
  if (!width || width.trim().length < 1) return custom_error(res, 400, "Image width not provided");
  if (!height || height.trim().length < 1) return custom_error(res, 400, "Image height not provided");
  
  const num_width = Number(width);
  const num_height = Number(height);
  
  if (isNaN(num_width)) return custom_error(res, 400, "Image width must be a numeric value");
  if (isNaN(num_height)) return custom_error(res, 400, "Image height must be a numeric value");
  if (num_width < 1) return custom_error(res, 400, "Image width must be value greater than or equal to 1");
  if (num_height < 1) return custom_error(res, 400, "Image height must be value greater than or equal to 1");

  next();
}

export const check_category_labels: T_Controller = function(req, res, next) {
  const { label_am, label_ru } = req.body;

  if (typeof label_am !== "string") return custom_error(res, 400, `typeof label_am is ${typeof label_am}`);
  if (!label_am) return custom_error(res, 400, "Կատեգորիայի հայերեն անվանումը նշված չէ");
  if (typeof label_ru !== "string") return custom_error(res, 400, `typeof label_ru is ${typeof label_ru}`);
  if (!label_ru) return custom_error(res, 400, "Կատեգորիայի ռուսերեն անվանումը նշված չէ");
  const label_am_trimmed = label_am.trim();
  const label_ru_trimmed = label_ru.trim();
  if (label_am_trimmed.length < 1) return custom_error(res, 400, "Կատեգորիայի հայերեն անվանումը նշված չէ");
  if (label_ru_trimmed.length < 1) return custom_error(res, 400, "Կատեգորիայի ռուսերեն անվանումը նշված չէ");

  req.body = {
    label_am: label_am_trimmed,
    label_ru: label_ru_trimmed
  }
  
  next();
}

export const check_new_password: T_Controller = function(req, res, next) {
  const { password, new_password } = req.body;

  if (typeof password !== "string") return custom_error(res, 400, `typeof password is ${typeof password}`); 
  if (!password) return custom_error(res, 400, "Գաղտնաբառը բացակայում է");
  if (typeof new_password !== "string") return custom_error(res, 400, `typeof new_password is ${typeof new_password}`); 
  if (!new_password) return custom_error(res, 400, "Նոր գաղտնաբառը բացակայում է");
  
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!,@,#,$,%,^,&,*,(,),?,>,<,-,_,{,}]).{8,32}$/gm;
  const is_format_correct = regex.test(new_password);
  if (!is_format_correct) {
    return custom_error(res, 400, "Գաղտնաբառը պետք է ունենա առնվազն 8 և առավելագույնը 32 նիշ երկարություն և պարունակի հետևյալ նիշերից յուրաքանչյուրը. մեծատառ տառ, փոքրատառ տառ, թվանշան, հատուկ նշան (!,@,#,$,%,^,&,*,(,),?,>,<,-,_,{,})");
  }

  next();
}

export const check_cart_items_body: T_Controller = function(req, res, next) {
  const { items } = req.body as { items: T_Cart_Item_Request[] };
  if (!items || !Array.isArray(items)) return custom_error(res, 400 , "No items or items is not iterable");

  for (let item of items) {
    if (!item.item_id || typeof item.item_id !== "string") return custom_error(res, 400, "No Item ID or Item ID of wrong type");
    if (!item.photo_id || typeof item.photo_id !== "string") return custom_error(res, 400, "No Photo ID or Photo ID of wrong type");
  }
  
  next();
}

export const check_order: T_Controller = function(req, res, next) {
  const { name, address, phone, comment, order } = req.body;
  if (!name || name.length < 1 || typeof name !== "string" || name.length > 50) return custom_error(res, 400, "Name error");
  if (!address || address.length < 1 || typeof address !== "string" || address.length > 50) return custom_error(res, 400, "Address error");
  if (!phone || phone.length < 1 || typeof phone !== "string" || phone.length > 50) return custom_error(res, 400, "Phone error");
  if (typeof comment !== "string" || comment.length > 300) return custom_error(res, 400, "Comment error");

  if (typeof order !== "object" || Object.keys(order).length < 1) return custom_error(res, 400, "Order error");
  next();
}