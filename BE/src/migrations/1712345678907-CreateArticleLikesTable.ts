import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateArticleLikesTable1712345678907 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "article_likes",
                columns: [
                    {
                        name: "articleId",
                        type: "int",
                        isPrimary: true,
                    },
                    {
                        name: "userId",
                        type: "int",
                        isPrimary: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ["articleId"],
                        referencedTableName: "article",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["userId"],
                        referencedTableName: "user",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("article_likes");
    }
} 