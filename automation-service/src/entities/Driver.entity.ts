import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: 'license_number', unique: true }) // <--
    license_number: string;

    @CreateDateColumn({ name: 'created_at' }) // <--
    created_at: Date;
}
