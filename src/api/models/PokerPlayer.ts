import { IsNotEmpty } from 'class-validator';
import { Entity, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class PokerPlayer {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    @IsNotEmpty()
    public username: string;

    @Column()
    @IsNotEmpty()
    public initialElo: number;

    @Column()
    @IsNotEmpty()
    public turn: boolean;

    @Column('int', { array: true })
    @IsNotEmpty()
    public hand: number[];

    @Column()
    @IsNotEmpty()
    public stack: number;

    @Column()
    @IsNotEmpty()
    public bigBlind: boolean;

    @Column()
    public bet: number;

    @Column()
    public outcome: string;

    @Column()
    public finalElo: number;

    @Column()
    public nextHand: boolean;

    @Column()
    public rematchRequested: boolean;

    @ManyToOne(type => User, user => user.username)
    @JoinColumn({ name: 'username' })
    public user: User;
}
