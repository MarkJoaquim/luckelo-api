import { IsNotEmpty } from 'class-validator';
import { Entity, CreateDateColumn, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BalderdashPlayer } from './BalderdashPlayer';
import { BalderdashWord } from './BalderdashWord';
import { BalderdashState } from './BalderdashState';

@Entity()
export class BalderdashMatch {
    @PrimaryGeneratedColumn()
    public id: number;

    @CreateDateColumn()
    public created: Date;

    @Column()
    @IsNotEmpty()
    public room: string;

    @Column({
        type: 'enum',
        enum: BalderdashState,
        default: BalderdashState.lobby,
    })
    public state: BalderdashState;

    @ManyToOne(type => BalderdashWord)
    public word: BalderdashWord;

    @OneToMany(type => BalderdashPlayer, player => player.match)
    public players: BalderdashPlayer[];
}
