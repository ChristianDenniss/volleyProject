import { Request, Response } from "express";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ApplicationService } from "./application.service.js";

export class ApplicationController {
    private service = new ApplicationService();

    public getAll = async (_req: Request, res: Response): Promise<void> => {
        try {
            const applications = await this.service.getAll();
            res.status(200).json(applications);
        } catch (error) {
            res.status(500).json({
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    public updateBySlug = async (req: Request, res: Response): Promise<void> => {
        const { slug } = req.params;

        try {
            const updated = await this.service.updateBySlug(slug, req.body);
            res.status(200).json(updated);
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(404).json({ message: error.message });
                return;
            }
            res.status(500).json({
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
}
