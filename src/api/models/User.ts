import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { BeforeInsert, Column, Entity, PrimaryColumn, BeforeUpdate, OneToMany, JoinColumn } from 'typeorm';
import { Elo } from './Elo';

@Entity()
export class User {

    public static hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    }

    public static comparePassword(user: User, password: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            bcrypt.compare(password, user.password, (err, res) => {
                resolve(res === true);
            });
        });
    }

    @PrimaryColumn()
    @IsNotEmpty()
    public username: string;

    @IsNotEmpty()
    @Column()
    @Exclude()
    public password: string;

    @OneToMany(type => Elo, elo => elo.username)
    @JoinColumn({ name: 'username'})
    public elos: Elo[];

    public toString(): string {
        return this.username;
    }

    @BeforeInsert()
    @BeforeUpdate()
    public async hashPassword(): Promise<void> {
        this.password = await User.hashPassword(this.password);
    }

}
