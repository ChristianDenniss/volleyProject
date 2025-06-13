import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryColumn } from 'typeorm';
import type { Article } from "../articles/article.entity.ts";

@Entity()
export class User
{
    @PrimaryColumn({type: "bigint", nullable: false})
    userId!: number

    @Column()
    username!: string;

    @Column({ default: "unspecified"})
    displayName!: string;

    @Column({ default: "", type: "varchar", length: 255 })
    img!: string;

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
