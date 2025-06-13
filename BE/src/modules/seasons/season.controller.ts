import { Request, Response } from "express";
import { SeasonService } from "./season.service.ts";

export class SeasonController
{
    private seasonService: SeasonService;

    constructor()
    {
        this.seasonService = new SeasonService();
    }

    /* ------------------------------------------------------------
       Create a new season
    ------------------------------------------------------------ */
    createSeason = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const {
                seasonNumber,
                startDate,
                endDate,
                theme,        // NEW – required
                image         // NEW – optional
            } = req.body;

            const savedSeason = await this.seasonService.createSeason(
                seasonNumber,
                new Date(startDate),
                new Date(endDate),
                theme,
                image
            );

            res.status(201).json(savedSeason);
        }
        catch (error: unknown)
        {
            this.handleError(error, res, "creating");
        }
    };

    /* ------------------------------------------------------------
       Get all seasons
    ------------------------------------------------------------ */
    getAllSeasons = async (_req: Request, res: Response): Promise<void> =>
    {
        try
        {
            console.log('Attempting to fetch all seasons...');
            const seasons = await this.seasonService.getAllSeasons();
            console.log(`Successfully fetched ${seasons.length} seasons`);
            res.status(200).json(seasons);
        }
        catch (error: unknown)
        {
            console.error('Error in getAllSeasons:', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error,
                timestamp: new Date().toISOString()
            });
            this.handleError(error, res, "fetching seasons");
        }
    };

    /* ------------------------------------------------------------
       Get season by ID
    ------------------------------------------------------------ */
    getSeasonById = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const id      = Number(req.params.id);
            const season  = await this.seasonService.getSeasonById(id);
            res.status(200).json(season);
        }
        catch (error: unknown)
        {
            this.handleError(error, res, "fetching season");
        }
    };

    /* ------------------------------------------------------------
       Update a season
    ------------------------------------------------------------ */
    updateSeason = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const id = Number(req.params.id);
            const {
                seasonNumber,
                startDate,
                endDate,
                theme,       // NEW – may be supplied
                image        // NEW – may be supplied
            } = req.body;

            const updated = await this.seasonService.updateSeason(
                id,
                seasonNumber,
                startDate ? new Date(startDate) : undefined,
                endDate   ? new Date(endDate)   : undefined,
                theme,
                image
            );

            res.status(200).json(updated);
        }
        catch (error: unknown)
        {
            this.handleError(error, res, "updating season");
        }
    };

    /* ------------------------------------------------------------
       Delete a season
    ------------------------------------------------------------ */
    deleteSeason = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const id = Number(req.params.id);
            await this.seasonService.deleteSeason(id);
            res.status(204).send();
        }
        catch (error: unknown)
        {
            this.handleError(error, res, "deleting season");
        }
    };

    /* ------------------------------------------------------------
       Shared error-handling helper
    ------------------------------------------------------------ */
    private handleError(
        error: unknown,
        res: Response,
        action: string
    ): void
    {
        const message =
            error instanceof Error ? error.message : `Failed while ${action}`;

        if (
            message.includes("required") ||
            message.includes("already exists") ||
            message.includes("out of bounds") ||
            message.includes("Cannot delete") ||
            message.includes("not found") ||
            message.includes("must be between")
        )
        {
            res.status(400).json({ error: message });
        }
        else
        {
            console.error(`Error ${action}:`, error);
            res.status(500).json({ error: `Failed while ${action}` });
        }
    }
}
