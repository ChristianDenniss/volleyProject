import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArticleLikes1710000000001 implements MigrationInterface {
    name = 'AddArticleLikes1710000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add likedBy column to article table
        await queryRunner.query(`
            ALTER TABLE "article" 
            ADD COLUMN "liked_by_id" integer,
            ADD CONSTRAINT "FK_article_liked_by" 
            FOREIGN KEY ("liked_by_id") 
            REFERENCES "user"("id") 
            ON DELETE SET NULL
        `);

        // Add index for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_article_liked_by" ON "article" ("liked_by_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_article_liked_by"`);
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_article_liked_by"`);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "liked_by_id"`);
    }
} 