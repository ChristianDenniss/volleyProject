import { Application, Router } from 'express';
import { ArticleController } from './article.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { createArticleSchema, updateArticleSchema } from './article.schema.js';

export function registerArticleRoutes(app: Application): void
{
    const router = Router();
    const articleController = new ArticleController();

    // Create a new article - PROTECTED
    router.post('/', authenticateCombined, validate(createArticleSchema), articleController.createArticle);

    // GET routes - PUBLIC (for website display)
    router.get('/', articleController.getAllArticles);
    router.get('/user/:userId', articleController.getArticlesByAuthorId);
    router.get('/:id', articleController.getArticleById);

    // UPDATE/DELETE routes - PROTECTED
    router.put('/:id', authenticateCombined, articleController.updateArticle);
    router.patch('/:id', authenticateCombined, validate(updateArticleSchema), articleController.updateArticle);
    router.delete('/:id', authenticateCombined, articleController.deleteArticle);

    // Like an article (requires authentication)
    router.post('/:id/like', authenticateCombined, articleController.likeArticle);

    // Unlike an article (requires authentication)
    router.delete('/:id/like', authenticateCombined, articleController.unlikeArticle);

    // Check if current user has liked an article (requires authentication)
    router.get('/:id/like-status', authenticateCombined, articleController.checkUserLikeStatus);

    // Register router with prefix
    app.use('/api/articles', router);
}
