import { Request, Response, NextFunction } from "express";
import { ApplicationService } from "./application.service.js";
import { parsePagination, toPaginatedResult } from "../../utils/pagination.js";

const APPLICATIONS_DEFAULT_LIMIT = 25;

export class ApplicationController {
    private service = new ApplicationService();

    public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, APPLICATIONS_DEFAULT_LIMIT);
            const [data, total] = await this.service.getAll(pagination);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    public updateBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { slug } = req.params;

        try {
            const updated = await this.service.updateBySlug(slug, req.body);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    };
}
