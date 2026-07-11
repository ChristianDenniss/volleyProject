import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Article } from './article.entity.js';
import { User } from '../user/user.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { PaginationParams } from '../../utils/pagination.js';

export class ArticleService {
    private articleRepository: Repository<Article>;
    private userRepository: Repository<User>;

    constructor() {
        this.articleRepository = AppDataSource.getRepository(Article);
        this.userRepository = AppDataSource.getRepository(User);
    }

    /**
     * Create a new article with validation
     */
    async createArticle(
        title: string, 
        content: string, 
        userId: number, 
        summary: string, 
        imageUrl: string
    ): Promise<Article> {
        // Validation
        if (!title) throw new MissingFieldError("Article title");
        if (!content) throw new MissingFieldError("Article content");
        if (!userId) throw new MissingFieldError("User ID");
        if (!summary) throw new MissingFieldError("Article summary");
        if (!imageUrl) throw new MissingFieldError("Article image URL");

        // Fetch the user (author)
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        // Create new article
        const newArticle = new Article();
        newArticle.title = title;
        newArticle.content = content;
        newArticle.summary = summary;
        newArticle.imageUrl = imageUrl;
        newArticle.author = user;  // Linking author to article
        newArticle.likes = 0;  // Initialize likes to 0
        newArticle.approved = null;  // Initialize approved as null

        return this.articleRepository.save(newArticle);
    }

    /**
     * Get all articles with their author
     */
    async getAllArticles(pagination: PaginationParams): Promise<[Article[], number]> {
        return this.articleRepository.findAndCount({
            relations: ["author"],  // Including the author in the response
            select: { id: true, title: true, summary: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, approved: true, likes: true, author: { id: true, username: true, role: true } },
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get article by ID with validation
     */
    async getArticleById(id: number): Promise<Article> {
        if (!id) throw new MissingFieldError("Article ID");

        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["author"],  // Including author in response
            select: { id: true, title: true, summary: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, approved: true, likes: true, author: { id: true, username: true, role: true } },
        });

        if (!article) throw new NotFoundError(`Article with ID ${id} not found`);

        return article;
    }

    /**
     * Update an article with validation
     */
    async updateArticle(
        id: number, 
        title?: string, 
        content?: string, 
        userId?: number,
        summary?: string,
        imageUrl?: string,
        approved?: boolean
    ): Promise<Article> {
        if (!id) throw new MissingFieldError("Article ID");

        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["author"],  // Including author in the response
        });

        if (!article) throw new NotFoundError(`Article with ID ${id} not found`);

        if (title) article.title = title;
        if (content) article.content = content;
        if (summary) article.summary = summary;
        if (imageUrl) article.imageUrl = imageUrl;
        if (approved !== undefined) article.approved = approved; // Allow setting to true or false

        if (userId) {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) throw new NotFoundError(`User with ID ${userId} not found`);
            article.author = user;  // Re-assign author if provided
        }

        return this.articleRepository.save(article);
    }

    /**
     * Delete an article with validation
     */
    async deleteArticle(id: number): Promise<void> {
        if (!id) throw new MissingFieldError("Article ID");

        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["author"],  // Including author in response for consistency
        });

        if (!article) throw new NotFoundError(`Article with ID ${id} not found`);

        await this.articleRepository.remove(article);
    }

    /**
     * Get articles by user ID (author) with validation
     */
    async getArticlesByUserId(userId: number, pagination: PaginationParams): Promise<[Article[], number]> {
        if (!userId) throw new MissingFieldError("User ID");

        // Check if user exists
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        return this.articleRepository.findAndCount({
            where: { author: { id: userId } },
            relations: ["author"],  // Including author in response
            select: { id: true, title: true, summary: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, approved: true, likes: true, author: { id: true, username: true, role: true } },
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Like an article
     */
    async likeArticle(id: number, userId?: number): Promise<Article> {
        if (!id) throw new MissingFieldError("Article ID");

        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["author", "likedBy"],  // Include likedBy relation
            select: { id: true, title: true, summary: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, approved: true, likes: true, author: { id: true, username: true, role: true }, likedBy: { id: true, username: true } },
        });

        if (!article) throw new NotFoundError(`Article with ID ${id} not found`);

        // If userId is provided, check if user already liked the article
        if (userId) {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

            // Check if user already liked this article
            const hasLiked = article.likedBy?.some(likedUser => likedUser.id === userId);
            if (hasLiked) {
                throw new Error("User has already liked this article");
            }

            // Add user to likedBy array
            if (!article.likedBy) {
                article.likedBy = [];
            }
            article.likedBy.push(user);
        }

        // Increment the like count
        article.likes = (article.likes || 0) + 1;
        
        return this.articleRepository.save(article);
    }

    /**
     * Unlike an article
     */
    async unlikeArticle(id: number, userId?: number): Promise<Article> {
        if (!id) throw new MissingFieldError("Article ID");

        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["author", "likedBy"],  // Include likedBy relation
            select: { id: true, title: true, summary: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, approved: true, likes: true, author: { id: true, username: true, role: true }, likedBy: { id: true, username: true } },
        });

        if (!article) throw new NotFoundError(`Article with ID ${id} not found`);

        // If userId is provided, check if user has liked the article
        if (userId) {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

            // Check if user has liked this article
            const hasLiked = article.likedBy?.some(likedUser => likedUser.id === userId);
            if (!hasLiked) {
                throw new Error("User has not liked this article");
            }

            // Remove user from likedBy array
            if (article.likedBy) {
                article.likedBy = article.likedBy.filter(likedUser => likedUser.id !== userId);
            }
        }

        // Decrement the like count (but don't go below 0)
        article.likes = Math.max((article.likes || 0) - 1, 0);
        
        return this.articleRepository.save(article);
    }

    /**
     * Check if a user has liked an article
     */
    async hasUserLikedArticle(articleId: number, userId: number): Promise<boolean> {
        if (!articleId) throw new MissingFieldError("Article ID");
        if (!userId) throw new MissingFieldError("User ID");

        const article = await this.articleRepository.findOne({
            where: { id: articleId },
            relations: ["likedBy"],
        });

        if (!article) throw new NotFoundError(`Article with ID ${articleId} not found`);

        return article.likedBy?.some(user => user.id === userId) || false;
    }
}
