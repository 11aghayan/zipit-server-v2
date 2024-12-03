import { T_Controller } from "../types";
import { custom_error } from "../util/error_handlers";

const route_not_found: T_Controller = async function (_req, res) {
  return custom_error(res, 404, "Route does not exist");
};

export default route_not_found;
