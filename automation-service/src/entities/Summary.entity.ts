import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Load } from "./Load.entity";

@Entity('summaries')
export class Summary {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Load, load => load.summaries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'load_id' })
    load: Load;

    @Column({ name: 'summary_text', type: 'text' })
    summary_text: string;

    @Column('jsonb', { nullable: true })
    insights: string[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    created_at: Date;
}
