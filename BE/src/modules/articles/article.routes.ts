import { Application, Router } from 'express';
import { ArticleController } from './article.controller.js';
import { validate } from '../../middleware/validate.js';
import { createArticleSchema, updateArticleSchema } from './article.schema.js';

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

    // Like an article
    router.post('/:id/like', articleController.likeArticle);

    // Register router with prefix
    app.use('/api/articles', router);
}
