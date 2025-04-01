import Db from "../db/backup-methods";
import { Db_Error_Response } from "../db/responses";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";

export const backup_db: T_Controller = async function(req, res) {
  try {
    const data = await Db.get_all_data();
    if (data instanceof Db_Error_Response) {
      return custom_error(res, 500, "Backup DB error");
    }

    return res.status(200).json(data);
  } catch (error) {
    return server_error(res, "backup_db", error);
  }
}