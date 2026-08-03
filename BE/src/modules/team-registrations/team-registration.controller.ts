import { Request, Response, NextFunction } from "express";
import { TeamRegistrationService } from "./team-registration.service.js";
import { RegionCode } from "../regions/region.entity.js";

export class TeamRegistrationController {
    private service = new TeamRegistrationService();

    submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const row = await this.service.submit(req.user.id, req.body);
            res.status(201).json(this.service.toDetailDto(row, true));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const id = Number(req.params.id);
            const row = await this.service.updatePending(req.user.id, id, req.body);
            res.json(this.service.toDetailDto(row, true));
        } catch (error) {
            next(error);
        }
    };

    withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            await this.service.withdraw(req.user.id, Number(req.params.id));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const region = typeof req.query.region === "string" ? (req.query.region as RegionCode) : undefined;
            const seasonId = req.query.seasonId ? Number(req.query.seasonId) : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const rows = await this.service.list({ region, seasonId, status });

            const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
            if (isAdmin && req.query.full === "1") {
                res.json(rows.map((r) => this.service.toDetailDto(r, true)));
                return;
            }
            res.json(rows.map((r) => this.service.toPublicDto(r)));
        } catch (error) {
            next(error);
        }
    };

    summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const region = typeof req.query.region === "string" ? (req.query.region as RegionCode) : undefined;
            const seasonId = req.query.seasonId ? Number(req.query.seasonId) : undefined;
            res.json(await this.service.summary(region, seasonId));
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = Number(req.params.id);
            const row = await this.service.getById(id);
            const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
            const isOwner = req.user?.id === row.submittedByUserId;
            if (!isAdmin && !isOwner) {
                res.json(this.service.toDetailDto(row, false));
                return;
            }
            res.json(this.service.toDetailDto(row, isAdmin));
        } catch (error) {
            next(error);
        }
    };

    accept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const result = await this.service.tryAccept(Number(req.params.id), req.user.id);
            if (!result.ok) {
                res.status(409).json({
                    error: "Conflicts detected",
                    conflicts: result.conflicts,
                    registration: this.service.toDetailDto(result.registration, true),
                });
                return;
            }
            res.json({
                registration: this.service.toDetailDto(result.registration, true),
                team: result.team,
            });
        } catch (error) {
            next(error);
        }
    };

    resolve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const result = await this.service.resolve(Number(req.params.id), req.user.id, req.body);
            if ("ok" in result && result.ok === false) {
                res.status(409).json({
                    error: "Conflicts detected",
                    conflicts: result.conflicts,
                    registration: this.service.toDetailDto(result.registration, true),
                });
                return;
            }
            if ("ok" in result && result.ok === true) {
                res.json({
                    registration: this.service.toDetailDto(result.registration, true),
                    team: result.team,
                });
                return;
            }
            res.json({ registration: this.service.toDetailDto((result as { registration: never }).registration, true) });
        } catch (error) {
            next(error);
        }
    };

    deny = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const row = await this.service.deny(Number(req.params.id));
            res.json(this.service.toDetailDto(row, true));
        } catch (error) {
            next(error);
        }
    };

    revoke = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const row = await this.service.revoke(Number(req.params.id));
            res.json(this.service.toDetailDto(row, true));
        } catch (error) {
            next(error);
        }
    };
}
