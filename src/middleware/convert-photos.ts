import sharp from "sharp";

import { T_Controller, T_Item_Body } from "../types";
import { custom_error, error_logger } from "../util/error_handlers";

export const convert_photos_to_webp: T_Controller = async function(req, res, next) {
  const { variants } = req.body as T_Item_Body;
  const converted_variants_promise = variants.map(async (variant) => {
    const { photo_src } = variant;
    const webp_format = "data:image/webp";
    const [img_format, img_data] = photo_src.split(";");
    if (img_format === webp_format) return variant;

    const buffer = Buffer.from(img_data.split(",")[1], "base64");
    try {
      const converted_buffer = await sharp(buffer).webp().toBuffer();
      const converted_photo_src = `${webp_format};base64,${converted_buffer.toString("base64")}`;
      return {
        ...variant,
        photo_src: converted_photo_src
      };
    } catch (error) {
      error_logger("convert_photos_to_webp", error);
      return null;
    }
  });

  const converted_variants = await Promise.all(converted_variants_promise);
  if (converted_variants.includes(null)) return custom_error(res, 400, "Wrong image data");
  req.body.variants = converted_variants;
  next();
}