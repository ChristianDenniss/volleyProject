import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import type { Article } from "../articles/article.entity.js";

@Entity()
export class User
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ nullable: true, type: 'varchar' })
    email!: string | null;

    @Column({ select: false, nullable: true, type: 'varchar' })
    password!: string | null;

    @Column({ default: 'user' })
    role!: string;

    @Column({ default: 0 })
    tokenVersion!: number;

    @Index({ unique: true, where: '"robloxUserId" IS NOT NULL' })
    @Column({ type: 'varchar', nullable: true })
    robloxUserId!: string | null;

    @Index({ unique: true, where: '"robloxUsername" IS NOT NULL' })
    @Column({ type: 'varchar', nullable: true })
    robloxUsername!: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany('Article', 'author')
    articles!: Article[];
}
