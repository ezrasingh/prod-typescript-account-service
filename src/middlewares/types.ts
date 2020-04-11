import { Request, Response, NextFunction } from "express";

export interface IMiddlewareHandler{
	req: Request,
	res: Response,
	next: NextFunction
}
