import { IsNotEmpty } from 'class-validator';
import { Entity, ManyToOne, JoinColumn, CreateDateColumn, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Game } from './Game';
import { DicePlayer } from './DicePlayer';

@Entity()
export class DiceMatch {
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

    @OneToMany(type => DicePlayer, player => player.match)
    public players: DicePlayer[];
}
