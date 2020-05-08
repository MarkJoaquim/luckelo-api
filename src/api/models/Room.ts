import { Entity, JoinColumn, Column, PrimaryColumn, OneToOne } from 'typeorm';
import { Match } from './Match';

@Entity()
export class Room {
    @PrimaryColumn()
    public room: string;

    @Column()
    public matchId: number;

    @OneToOne(type => Match)
    @JoinColumn({ name: 'matchId' })
    public match: Match;
}
