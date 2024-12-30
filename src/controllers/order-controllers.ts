import { createTransport } from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection"; 

import * as Db from "../db";
import { T_Controller } from "../types";
import { custom_error, server_error } from "../util/error_handlers";
import { generate_email_message } from "../util/order-utils";


const transporter = createTransport({
  host: process.env.NODEMAILER_HOST as string,
  port: Number(process.env.NODEMAILER_PORT as string),
  secure: !!Number(process.env.NODEMAILER_SECURE),
  auth: {
    user: process.env.NODEMAILER_USER as string,
    pass: process.env.NODEMAILER_PASSWORD as string
  },
  debug: true
});


export const confirm_order: T_Controller = async function(req, res) {
  const connection = new SMTPConnection({
    host: process.env.NODEMAILER_HOST as string,
    port: Number(process.env.NODEMAILER_PORT as string),
    secure: !!Number(process.env.NODEMAILER_SECURE),
    auth: {
      user: process.env.NODEMAILER_USER as string,
      pass: process.env.NODEMAILER_PASSWORD as string
    },
  });
  const { order } = req.body;
  try {
    const items = await Db.get_items_by_photo_ids(Object.keys(order));
    if (items instanceof Db.Db_Error_Response) {
      return custom_error(res, 500, "db_error");
    }
    const email_message = generate_email_message({ ...req.body, items: items.rows });

    connection.connect((err) => {
      if (err) {
        return custom_error(res, 500, "Order error");
      }
      return res.status(200).json({ ok: true });
    });
    
    // const mail_res = await transporter.sendMail(email_message);
    // console.log(mail_res);
    // if (mail_res.rejected.length > 0) {
      //   return custom_error(res, 500, "Order error");
      // }
  } catch (error) {
    return server_error(res, "confirm_order", error);
  }
}