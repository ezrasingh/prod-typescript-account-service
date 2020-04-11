import { Request, Response } from "express";

export interface IControllerHandler{
	req: Request,
	res: Response
};
