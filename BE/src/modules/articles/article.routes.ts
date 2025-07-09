import { Application, Router } from 'express';
import { ArticleController } from './article.controller.ts';
import { validate } from '../../middleware/validate.ts';
import { authenticateToken } from '../../middleware/authentication.js';
import { createArticleSchema, updateArticleSchema } from './article.schema.ts';

export function registerArticleRoutes(app: Application): void
{
    const router = Router();
    const articleController = new ArticleController();

    // Create a new article
    router.post('/', validate(createArticleSchema), articleController.createArticle);

    // Get all articles
    router.get('/', articleController.getAllArticles);

    // Get articles by user (author) - placed BEFORE generic ID route
    router.get('/user/:userId', articleController.getArticlesByAuthorId);

    // Get an article by ID
    router.get('/:id', articleController.getArticleById);

    // Update an article (PUT - full)
    router.put('/:id', articleController.updateArticle);

    // Update an article (PATCH - partial)
    router.patch('/:id', validate(updateArticleSchema), articleController.updateArticle);

    // Delete an article
    router.delete('/:id', articleController.deleteArticle);

    // Like an article (requires authentication)
    router.post('/:id/like', authenticateToken, articleController.likeArticle);

    // Unlike an article (requires authentication)
    router.delete('/:id/like', authenticateToken, articleController.unlikeArticle);

    // Check if current user has liked an article (requires authentication)
    router.get('/:id/like-status', authenticateToken, articleController.checkUserLikeStatus);

    // Register router with prefix
    app.use('/api/articles', router);
}
