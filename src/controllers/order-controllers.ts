import mailjet from "node-mailjet";
import Db from "../db/item-methods"
import { Db_Error_Response } from "../db/responses";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";
import { generate_email_message } from "../util/order-utils";

const mj = mailjet.apiConnect(process.env.MAILJET_API_KEY as string, process.env.MAILJET_SECRET_KEY as string);

export const confirm_order: T_Controller = async function(req, res) {
  const { order } = req.body;
  try {
    const items = await Db.get_items_by_photo_ids(Object.keys(order));
    if (items instanceof Db_Error_Response) {
      return custom_error(res, 500, "db_error");
    }
    const email_message = generate_email_message({ ...req.body, items: items.rows });
    
    const email_res = await mj.post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: "zipit.sender@gmail.com",
              Name: "ZIPIT Order"
            },
            To: [
              {
                Email: "info@zipit.am",
                Name: "Zipit Accessories"
              }
            ],
            Subject: email_message.subject,
            HTMLPart: email_message.message
          }
        ]
      });

    if (email_res.response.status !== 200) {
      return custom_error(res, 500, "Order error");
    }
      
    return res.status(200).json({ ok: true });
  } catch (error) {
    return server_error(res, "confirm_order", error);
  }
}