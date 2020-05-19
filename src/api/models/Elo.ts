import { IsNotEmpty } from 'class-validator';
import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './Game';
import { User } from './User';

@Entity()
export class Elo {
    @PrimaryColumn()
    @IsNotEmpty()
    public username: string;

    @PrimaryColumn()
    @IsNotEmpty()
    public game: string;

    @Column()
    @IsNotEmpty()
    public elo: number;

    @ManyToOne(type => Game)
    @JoinColumn({ name: 'game' })
    public gameObject: Game;

    @ManyToOne(type => User)
    @JoinColumn({ name: 'username' })
    public userObject: User;

    constructor(username: string, game: string) {
        this.username = username;
        this.game = game;
        this.elo = 1000;
    }

    public toString(): string {
        return this.game + ': ' + this.username + ' ' + this.elo;
    }
}
