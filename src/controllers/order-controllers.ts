import { createTransport } from "nodemailer";

import * as Db from "../db";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";
import { generate_email_message } from "../util/order-utils";

const transporter = createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "zipit.sender@gmail.com",
    pass: process.env.NODEMAILER_PASSWORD as string
  }
});

export const confirm_order: T_Controller = async function(req, res) {
  const { order } = req.body;
  try {
    const items = await Db.get_items_by_photo_ids(Object.keys(order));
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "db_error");
    }
    const email_message = generate_email_message({ ...req.body, items: items.rows });
    transporter.sendMail(email_message);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return server_error(res, "confirm_order", error);
  }
}