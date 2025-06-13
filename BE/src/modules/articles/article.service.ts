import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.ts';
import { Article } from './article.entity.ts';
import { User } from '../user/user.entity.ts';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';

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
        const user = await this.userRepository.findOneBy({ userId });
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
    async getAllArticles(): Promise<Article[]> {
        return this.articleRepository.find({
            relations: ["author"],  // Including the author in the response
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
            const user = await this.userRepository.findOneBy({ userId });
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
    async getArticlesByUserId(userId: number): Promise<Article[]> {
        if (!userId) throw new MissingFieldError("User ID");

        // Check if user exists
        const user = await this.userRepository.findOneBy({ userId });
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        return this.articleRepository.find({
            where: { author: { userId } },
            relations: ["author"],  // Including author in response
        });
    }

    /**
     * Like an article
     */
    async likeArticle(id: number): Promise<Article> {
        if (!id) throw new MissingFieldError("Article ID");

        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["author"],  // Including author in response
        });

        if (!article) throw new NotFoundError(`Article with ID ${id} not found`);

        article.likes = (article.likes || 0) + 1;  // Increment the like count
        return this.articleRepository.save(article);
    }
}
