import { Request, Response, NextFunction } from "express";

export type T_Controller = (req: Request, res: Response, next: NextFunction) => any;