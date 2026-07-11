import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const REGION_CODES = ['na', 'eu', 'as'] as const;
export type RegionCode = typeof REGION_CODES[number];

@Entity()
export class Region {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    code!: RegionCode;

    @Column()
    name!: string;

    @Column({ default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
