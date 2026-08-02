import { Request, Response, NextFunction } from 'express';
import { ArticleService, ArticleFilters } from './article.service.js';
import { parsePagination, toPaginatedResult } from '../../utils/pagination.js';

const ARTICLES_DEFAULT_LIMIT = 10;

export class ArticleController {
    private articleService: ArticleService;

    constructor() {
        this.articleService = new ArticleService();
    }

    public createArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { title, content, summary, imageUrl } = req.body;
        const userId = req.user?.id;

        try {
            if (!userId) {
                res.status(401).json({ message: 'Authentication required' });
                return;
            }

            const newArticle = await this.articleService.createArticle(
                title,
                content,
                userId,
                summary,
                imageUrl
            );
            res.status(201).json(newArticle);
        } catch (error) {
            next(error);
        }
    };

    public getAllArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, ARTICLES_DEFAULT_LIMIT);
            const filters = this.parseFilters(req);
            const [data, total] = await this.articleService.getAllArticles(pagination, filters);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    public getArticleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        try {
            const article = await this.articleService.getArticleById(Number(id));
            res.status(200).json(article);
        } catch (error) {
            next(error);
        }
    };

    public updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            next(error);
        }
    };

    public deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        try {
            await this.articleService.deleteArticle(Number(id));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    public getArticlesByAuthorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { userId } = req.params;

        try {
            const pagination = parsePagination(req.query, ARTICLES_DEFAULT_LIMIT);
            const [data, total] = await this.articleService.getArticlesByUserId(Number(userId), pagination);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    public likeArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        try {
            const updatedArticle = await this.articleService.likeArticle(Number(id), userId);
            res.status(200).json(updatedArticle);
        } catch (error) {
            next(error);
        }
    };

    public unlikeArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        try {
            const updatedArticle = await this.articleService.unlikeArticle(Number(id), userId);
            res.status(200).json(updatedArticle);
        } catch (error) {
            next(error);
        }
    };

    public checkUserLikeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        try {
            const hasLiked = await this.articleService.hasUserLikedArticle(Number(id), userId);
            res.status(200).json({ hasLiked });
        } catch (error) {
            next(error);
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
