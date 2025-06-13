import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Article } from "../articles/article.entity.ts";

@Entity()
export class User
{
    @PrimaryGeneratedColumn()
    userId!: number

    @Column()
    username!: string;

    @Column({ default: 'user' })
    role!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // No circular issue here — we use the string reference!
    @OneToMany('Article', 'author')
    articles!: Article[];
}
