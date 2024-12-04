import { T_Controller } from "../types";
import { custom_error } from "../util/error_handlers";

const valid_langs = ["am", "ru"];

export const check_lang: T_Controller = function(req, res, next) {
  const { lang } = req.query as { lang?: string };

  if (!lang || !valid_langs.includes(lang)) {
    return custom_error(res, 400, `lang must be either am or ru, you provided ${lang}`);
  }
  next();
};

export const check_item_body: T_Controller = function(_req, _res, next) {
  next();
}

export function check_category_labels() {

}

export function check_if_category_empty() {
  
}

export function check_new_password() {
  
}