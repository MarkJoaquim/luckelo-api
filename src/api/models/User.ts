import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { Column, Entity, PrimaryColumn, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { Elo } from './Elo';
import { Charm } from './Charm';

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

    /* tslint:disable no-inferrable-types */
    @IsNotEmpty()
    @Column()
    public currency: number = 0;

    @OneToMany(type => Elo, elo => elo.username)
    @JoinColumn({ name: 'username'})
    public elos: Elo[];

    @OneToOne(type => Charm, charm => charm.user)
    @JoinColumn()
    public charm: Charm;

    public toString(): string {
        return this.username;
    }

    public async hashPassword(): Promise<void> {
        this.password = await User.hashPassword(this.password);
    }

}
