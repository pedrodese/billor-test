import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Summary } from "./Summary.entity";

@Entity('loads')
export class Load {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    origin: string;

    @Column()
    destination: string;

    @Column({ name: 'pickup_time', nullable: true })
    pickupTime: string;

    @Column({ name: 'delivery_time', nullable: true })
    deliveryTime: string;

    @Column({ name: 'route', nullable: true })
    route: string;

    @Column({ name: 'loaded_weight', nullable: true })
    loadedWeight: string;

    @Column({ nullable: true })
    equipment: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    created_at: Date;

    @OneToMany(() => Summary, summary => summary.load)
    summaries: Summary[];
}
