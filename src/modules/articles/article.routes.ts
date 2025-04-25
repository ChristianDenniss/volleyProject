import { Application, Router } from 'express';
import { ArticleController } from './article.controller.js';

export function registerArticleRoutes(app: Application): void {
    const router = Router();
    const articleController = new ArticleController();

    // Article routes
    router.post('/', articleController.createArticle);  // Create new article
    router.get('/', articleController.getAllArticles);  // Get all articles
    router.get('/:id', articleController.getArticleById);  // Get article by ID
    router.put('/:id', articleController.updateArticle);  // Update article
    router.patch('/:id', articleController.updateArticle);  // Update article (partial)
    router.delete('/:id', articleController.deleteArticle);  // Delete article
    router.get('/user/:userId', articleController.getArticlesByAuthorId);  // Get articles by user (author)
    router.post('/:id/like', articleController.likeArticle);  // Like an article

    // Register router with prefix
    app.use('/api/articles', router);
}
