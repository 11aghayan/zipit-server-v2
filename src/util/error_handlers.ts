import { Response } from "express";

export function error_logger(function_name: string, err: any) {
  const time = new Date(Date.now()).getUTCDate();
  console.error(`${time}: Error in ${function_name}`, err);
}

export function server_error(res: Response, function_name: string, error: any) {
  error_logger(function_name, error);
  return res.sendStatus(500);
}

export function custom_error(res: Response, status: number, message: string) {
  return res.status(status).json({ message });
}