import sharp from "sharp";

import * as Db from '../db';

import { T_Controller, T_Item_Body, T_Item_Body_Variant, T_Item_Body_Variant_Edit } from "../types";
import { custom_error, error_logger, server_error } from "../util/error_handlers";

export const convert_photos_to_webp: T_Controller = async function(req, res, next) {
  try {
    const { variants: variants_full } = req.body as T_Item_Body;
  
    const variants = variants_full.filter(variant => !("delete" in variant));

    const converted_variants: (T_Item_Body_Variant | T_Item_Body_Variant_Edit)[] = [];
  
    for (let variant of variants) {
      const src_list = variant.src;
      const converted_src_list: string[] = [];
      for (let src of src_list) {
        const webp_format = "data:image/webp";
        const [img_format, img_data] = src.split(";");
        if (img_format === webp_format) return variant;
    
        const buffer = Buffer.from(img_data.split(",")[1], "base64");
        const converted_buffer = await sharp(buffer).webp().toBuffer();
        const converted_photo_src = `${webp_format};base64,${converted_buffer.toString("base64")}`;
        converted_src_list.push(converted_photo_src);
      }
      converted_variants.push({
        ...variant,
        src: converted_src_list
      });
    }
    const delete_variants = variants_full.filter(variant => "delete" in variant);

    req.body.variants = [...delete_variants, ...converted_variants];
    next();
  } catch (error) {
    error_logger("convert_photos_to_webp", error);
    return custom_error(res, 500, "Image conversion error");
  }
}

export const get_photo_from_db: T_Controller = async function(req, res, next) {
  const { width, height, index } = req.query;
  const { id } = req.params;

  try {
    const response = await Db.get_photo(id, index as string);
    if (response instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "Photo fetching error");
    }
    req.body.image = {
      width: Math.trunc(Number(width)),
      height: Math.trunc(Number(height)),
      src: response.rows[0].src
    };

    next();
  } catch (error) {
    return server_error(res, "get_photo_from_db", error);
  }
}

export const resize_image: T_Controller = async function(req, res, next) {
  const { image: { width, height, src } } = req.body;
  try {
    const img_data = src.split(";")[1];
    const buffer = Buffer.from(img_data.split(",")[1], "base64");
    const resized_buffer = await sharp(buffer).resize({ height, width, fit: "inside" }).toBuffer();
    req.body.image = resized_buffer;
    next(); 
  } catch (error) {
    return server_error(res, "resize_image", error);
  }
}