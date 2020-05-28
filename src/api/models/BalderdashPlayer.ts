import { IsNotEmpty } from 'class-validator';
import { Entity, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';
import { BalderdashMatch } from './BalderdashMatch';

@Entity()
export class BalderdashPlayer {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    @IsNotEmpty()
    public matchId: number;

    @Column()
    @IsNotEmpty()
    public username: string;

    @Column()
    @IsNotEmpty()
    public initialElo: number;

    @Column()
    public definition: string;

    @Column()
    public voted: boolean;

    @Column()
    public votedFor: number;

    @Column()
    public outcome: string;

    @Column()
    public finalElo: number;

    @Column()
    public rematchRequested: boolean;

    @ManyToOne(type => User, user => user.username)
    @JoinColumn({ name: 'username' })
    public user: User;

    @ManyToOne(type => BalderdashMatch, match => match.players)
    @JoinColumn({ name: 'matchId' })
    public match: BalderdashMatch;

    @ManyToOne(type => BalderdashPlayer)
    @JoinColumn({ name: 'votedFor' })
    public votee: BalderdashPlayer;
}
