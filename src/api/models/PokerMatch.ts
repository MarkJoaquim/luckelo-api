import { IsNotEmpty } from 'class-validator';
import { Entity, JoinColumn, CreateDateColumn, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { PokerPlayer } from './PokerPlayer';

@Entity()
export class PokerMatch {
    @PrimaryGeneratedColumn()
    public id: number;

    @CreateDateColumn()
    public created: Date;

    @Column()
    @IsNotEmpty()
    public room: string;

    @Column()
    @IsNotEmpty()
    public smallBlind: number;

    @Column()
    @IsNotEmpty()
    public bigBlind: number;

    @Column('int', { array: true })
    @IsNotEmpty()
    public cards: number[];

    @Column()
    @IsNotEmpty()
    public minRaise: number;

    @Column('int', { array: true })
    @IsNotEmpty()
    public boardState: number[];

    @Column()
    @IsNotEmpty()
    public handComplete: boolean;

    @Column()
    @IsNotEmpty()
    public handsPlayed: number;

    @OneToOne(type => PokerPlayer, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn()
    public player1: PokerPlayer;

    @OneToOne(type => PokerPlayer, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn()
    public player2: PokerPlayer;
}
