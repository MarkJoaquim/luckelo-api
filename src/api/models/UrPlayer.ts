import { IsNotEmpty } from 'class-validator';
import { Entity, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class UrPlayer {
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

    @Column()
    @IsNotEmpty()
    public piecesAtStart: number;

    @Column()
    @IsNotEmpty()
    public piecesHome: number;

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
}
