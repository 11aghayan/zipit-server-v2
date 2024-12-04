import { Pool } from "pg";

import { 
  get_all_items_public, 
  get_item_public } from './item-methods';

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
  get_item_public
};