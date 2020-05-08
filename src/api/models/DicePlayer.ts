import { IsNotEmpty } from 'class-validator';
import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn } from 'typeorm';
import { User } from './User';
import { Match } from './Match';

@Entity()
export class DicePlayer {
    @PrimaryColumn()
    public matchId: number;

    @PrimaryColumn()
    public username: string;

    @Column()
    @IsNotEmpty()
    public initialElo: number;

    @Column()
    public roll: number;

    @Column()
    public outcome: string;

    @Column()
    public finalElo: number;

    @Column()
    public rematchRequested: boolean;

    @ManyToOne(type => User, user => user.username)
    @JoinColumn({ name: 'username' })
    public user: User;

    @ManyToOne(type => Match, match => match.dicePlayers)
    @JoinColumn({ name: 'matchId' })
    public match: Match;
}
