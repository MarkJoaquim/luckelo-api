import { IsNotEmpty } from 'class-validator';
import { Entity, ManyToOne, JoinColumn, CreateDateColumn, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Game } from './Game';
import { UrPlayer } from './UrPlayer';

@Entity()
export class UrMatch {
    @PrimaryGeneratedColumn()
    public id: number;

    @CreateDateColumn()
    public created: Date;

    @Column()
    @IsNotEmpty()
    public room: string;

    @Column()
    @IsNotEmpty()
    public gameName: string;

    @ManyToOne(type => Game, game => game.name)
    @JoinColumn({ name: 'gameName' })
    public game: Game;

    @Column()
    @IsNotEmpty()
    public boardState: string;

    @OneToOne(type => UrPlayer, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn()
    public player1: UrPlayer;

    @OneToOne(type => UrPlayer, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn()
    public player2: UrPlayer;
}
