import { Request, Response } from 'express';
import { ArticleService, ArticleFilters } from './article.service.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { parsePagination, toPaginatedResult } from '../../utils/pagination.js';

const ARTICLES_DEFAULT_LIMIT = 10;

export class ArticleController {
    private articleService: ArticleService;

    constructor() {
        this.articleService = new ArticleService();
    }

    /**
     * Create a new article
     */
    public createArticle = async (req: Request, res: Response): Promise<void> => {
        const { title, content, userId, summary, imageUrl } = req.body;

        try {
            const newArticle = await this.articleService.createArticle(
                title,
                content,
                userId,
                summary,
                imageUrl
            );
            res.status(201).json(newArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    /**
     * Get all articles
     */
    public getAllArticles = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log(`[${new Date().toISOString()}] Incoming request to fetch all articles.`);
            const pagination = parsePagination(req.query, ARTICLES_DEFAULT_LIMIT);
            const filters = this.parseFilters(req);
            const [data, total] = await this.articleService.getAllArticles(pagination, filters);
            console.log(`[${new Date().toISOString()}] Articles fetched successfully:`, data);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            console.error(
                `[${new Date().toISOString()}] Error occurred while fetching articles:`,
                error
            );
            res
                .status(500)
                .json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    /**
     * Get an article by ID
     */
    public getArticleById = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const article = await this.articleService.getArticleById(Number(id));
            res.status(200).json(article);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    /**
     * Update an article
     */
    public updateArticle = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { title, content, userId, summary, imageUrl, approved } = req.body;

        try {
            const updatedArticle = await this.articleService.updateArticle(
                Number(id),
                title,
                content,
                userId,
                summary,
                imageUrl,
                approved
            );
            res.status(200).json(updatedArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    /**
     * Delete an article
     */
    public deleteArticle = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            await this.articleService.deleteArticle(Number(id));
            res.status(204).send(); // No content
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    /**
     * Get all articles by user ID (author)
     */
    public getArticlesByAuthorId = async (req: Request, res: Response): Promise<void> => {
        const { userId } = req.params;
        console.log(`[${new Date().toISOString()}] Attempting to fetch articles for user ID:`, userId);

        try {
            const pagination = parsePagination(req.query, ARTICLES_DEFAULT_LIMIT);
            const [data, total] = await this.articleService.getArticlesByUserId(Number(userId), pagination);
            console.log(`[${new Date().toISOString()}] Successfully fetched articles:`, data);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error in getArticlesByAuthorId:`, error);
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ 
                    message: 'Internal server error', 
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
        }
    };

    /**
     * Like an article
     */
    public likeArticle = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const userId = (req as any).user?.id; // Get user ID from authenticated request

        try {
            const updatedArticle = await this.articleService.likeArticle(Number(id), userId);
            res.status(200).json(updatedArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else if (error instanceof Error && error.message.includes("already liked")) {
                res.status(409).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    /**
     * Unlike an article
     */
    public unlikeArticle = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const userId = (req as any).user?.id; // Get user ID from authenticated request

        try {
            const updatedArticle = await this.articleService.unlikeArticle(Number(id), userId);
            res.status(200).json(updatedArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else if (error instanceof Error && error.message.includes("not liked")) {
                res.status(409).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    /**
     * Check if current user has liked an article
     */
    public checkUserLikeStatus = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const userId = (req as any).user?.id; // Get user ID from authenticated request

        try {
            const hasLiked = await this.articleService.hasUserLikedArticle(Number(id), userId);
            res.status(200).json({ hasLiked });
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    private parseFilters(req: Request): ArticleFilters {
        const raw = typeof req.query.status === 'string' ? req.query.status : undefined;
        if (raw === 'pending' || raw === 'approved' || raw === 'rejected') {
            return { status: raw };
        }
        return {};
    }
}
