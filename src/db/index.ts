import { Pool } from "pg";

import { 
  get_all_items_public, 
  get_item_public,
  get_similar_items,
  get_all_items_admin,
  get_item_admin,
  add_item,
  edit_item,
  delete_item,
  get_matching_items
} from './item-methods';

import { get_photo } from './photo-methods';

import { 
  get_categories_admin,
  get_categories_public,
  add_category,
  edit_category,
  delete_category
 } from "./category-methods";

import {
  get_credentials,
  change_user_password
} from "./auth-methods";
 
const {
  PG_USER: user,
  PG_HOST: host,
  PG_DATABASE: database,
  PG_PASSWORD: password
} = process.env;

const port = Number(process.env.PG_PORT ?? '5432');

export const db = new Pool({
  user,
  host,
  database,
  port,
  password
});

// Response Constructors
export class Db_Success_Response<T> {
  rows: T[];
  error = false;
  
  constructor(rows: T[]) {
    this.rows = rows;
  }
}

export class Db_Error_Response {
  err: unknown;
  error = true;
  
  constructor(err: any) {
    this.err = err;
  }
}

export {
  get_all_items_public,
  get_item_public,
  get_similar_items,
  get_all_items_admin,
  get_item_admin,
  add_item,
  edit_item,
  delete_item,
  get_photo,
  get_matching_items,
  get_categories_admin,
  get_categories_public,
  add_category,
  edit_category,
  delete_category,
  get_credentials,
  change_user_password
};