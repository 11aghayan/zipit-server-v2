import { T_Controller } from "../types";

export const get_photo: T_Controller = function(req, res) {
  const { image } = req.body;
  return res.status(200).send(image);
}