import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ArticleService } from '../article.service.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const TITLE = 'Match Recap';
const CONTENT = 'x'.repeat(240);
const SUMMARY = 'y'.repeat(50);
const IMAGE_URL = 'https://example.com/cover.jpg';

const mockArticleRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
};

const mockUserRepository = {
    findOneBy: jest.fn(),
};

function user(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        username: 'writer',
        email: 'writer@example.com',
        role: 'user',
        ...overrides,
    } as any;
}

describe('ArticleService', () => {
    let articleService: ArticleService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockArticleRepository.save.mockImplementation(async (entity: any) => entity);

        articleService = new ArticleService();
        (articleService as any).articleRepository = mockArticleRepository;
        (articleService as any).userRepository = mockUserRepository;
    });

    describe('createArticle', () => {
        it('throws MissingFieldError without a title', async () => {
            await expect(
                articleService.createArticle('', CONTENT, 1, SUMMARY, IMAGE_URL)
            ).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the author does not exist', async () => {
            mockUserRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(
                articleService.createArticle(TITLE, CONTENT, 99, SUMMARY, IMAGE_URL)
            ).rejects.toThrow(NotFoundError);
        });

        it('leaves regular-user articles pending approval', async () => {
            mockUserRepository.findOneBy.mockResolvedValueOnce(user() as never);

            const created = await articleService.createArticle(TITLE, CONTENT, 1, SUMMARY, IMAGE_URL);

            expect(created.approved).toBeNull();
        });

        it('auto-approves articles created by an admin', async () => {
            mockUserRepository.findOneBy.mockResolvedValueOnce(user({ role: 'admin' }) as never);

            const created = await articleService.createArticle(TITLE, CONTENT, 1, SUMMARY, IMAGE_URL);

            expect(created.approved).toBe(true);
        });

        it('auto-approves articles created by a superadmin', async () => {
            mockUserRepository.findOneBy.mockResolvedValueOnce(user({ role: 'superadmin' }) as never);

            const created = await articleService.createArticle(TITLE, CONTENT, 1, SUMMARY, IMAGE_URL);

            expect(created.approved).toBe(true);
        });
    });
});
