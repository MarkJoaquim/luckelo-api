import { IsNotEmpty } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Charm {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column('int', { array: true })
    @IsNotEmpty()
    public charm: number[];

    @Column('character varying', { array: true })
    @IsNotEmpty()
    public palette: string[];

    @Column()
    public name: string;

    @OneToOne(type => User, user => user.charm)
    public user: User;
}
