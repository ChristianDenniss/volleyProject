import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { User } from "../user/user.entity.ts";

@Entity()
export class Article
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: "text" })
    summary!: string;

    @Column({ type: "text" })
    content!: string;

    @Column()
    imageUrl!: string;

    @CreateDateColumn({ type: "timestamp" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt!: Date;

    @Column({ type: "boolean", nullable: true, default: null })
    approved!: boolean | null;

    // Keep the simple likes count for backward compatibility
    @Column({ default: 0 })
    likes!: number;

    // Add a many-to-many relationship for users who liked the article
    @ManyToMany(() => User)
    @JoinTable({
        name: "article_likes",
        joinColumn: {
            name: "articleId",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "userId",
            referencedColumnName: "id"
        }
    })
    likedBy!: User[];

    @ManyToOne(() => User, user => user.articles, { nullable: false })
    author!: User;
}
