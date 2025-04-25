import { Request, Response } from 'express';
import { ArticleService } from './article.service.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export class ArticleController {
    private articleService: ArticleService;

    constructor() {
        this.articleService = new ArticleService();
    }

    /**
     * Create a new article
     */
    async createArticle(req: Request, res: Response): Promise<void> {
        const { title, content, userId } = req.body;

        try {
            const newArticle = await this.articleService.createArticle(title, content, userId);
            res.status(201).json(newArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }

    /**
     * Get all articles
     */
    async getAllArticles(req: Request, res: Response): Promise<void> {
        try {
            const articles = await this.articleService.getAllArticles();
            res.status(200).json(articles);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Get an article by ID
     */
    async getArticleById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const article = await this.articleService.getArticleById(Number(id));
            res.status(200).json(article);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }

    /**
     * Update an article
     */
    async updateArticle(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { title, content, userId } = req.body;

        try {
            const updatedArticle = await this.articleService.updateArticle(
                Number(id), title, content, userId
            );
            res.status(200).json(updatedArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }

    /**
     * Delete an article
     */
    async deleteArticle(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            await this.articleService.deleteArticle(Number(id));
            res.status(204).send();  // No content
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }

    /**
     * Get all articles by user ID (author)
     */
    async getArticlesByAuthorId(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const articles = await this.articleService.getArticlesByUserId(Number(userId));
            res.status(200).json(articles);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }

    /**
     * Like an article
     */
    async likeArticle(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const updatedArticle = await this.articleService.likeArticle(Number(id));
            res.status(200).json(updatedArticle);
        } catch (error) {
            if (error instanceof MissingFieldError || error instanceof NotFoundError) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
}
