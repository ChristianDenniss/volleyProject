import { Request, Response } from 'express';
import { ArticleService } from './article.service.ts';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';

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
            const articles = await this.articleService.getAllArticles();
            console.log(`[${new Date().toISOString()}] Articles fetched successfully:`, articles);
            res.status(200).json(articles);
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
        const { title, content, userId, summary, imageUrl } = req.body;

        try {
            const updatedArticle = await this.articleService.updateArticle(
                Number(id),
                title,
                content,
                userId,
                summary,
                imageUrl
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
            const articles = await this.articleService.getArticlesByUserId(Number(userId));
            console.log(`[${new Date().toISOString()}] Successfully fetched articles:`, articles);
            res.status(200).json(articles);
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

        try {
            const updatedArticle = await this.articleService.likeArticle(Number(id));
            res.status(200).json(updatedArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };
}
