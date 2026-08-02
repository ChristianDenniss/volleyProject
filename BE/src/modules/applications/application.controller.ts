import { Request, Response, NextFunction } from "express";
import { ApplicationService } from "./application.service.js";

export class ApplicationController {
    private service = new ApplicationService();

    public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const applications = await this.service.getAll();
            res.status(200).json(applications);
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
