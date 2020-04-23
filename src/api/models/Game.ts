import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryColumn, OneToMany, JoinColumn } from 'typeorm';
import { Elo } from './Elo';

@Entity()
export class Game {
    @PrimaryColumn()
    @IsNotEmpty()
    public name: string;

    @OneToMany(type => Elo, elo => elo.gameObject)
    @JoinColumn({ name: 'name'})
    public elos: Elo[];

    public toString(): string {
        return this.name;
    }
}
