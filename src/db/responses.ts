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