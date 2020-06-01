import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Charm } from '../models/Charm';
import { CharmRepository } from '../repositories/CharmRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UserService } from './UserService';
import { User } from '../models/User';

@Service()
export class CharmService {
    private COSTS: Record<string, (num: number) => number> = {
        reroll: (num) => 5,
        pixel: (num) => Math.floor(Math.pow(num, 1.3)),
        color: (num) => Math.floor(Math.pow(num, 2)),
    };

    constructor(
        @OrmRepository() private userRepository: UserRepository,
        private userService: UserService,
        @OrmRepository() private charmRepository: CharmRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async findUserWithCharm(username: string): Promise<User> {
        let user = await this.userRepository.findOne(username, { relations: ['charm'] });
        if (!user.charm) {
            let newCharm = new Charm();
            newCharm.charm = [0];
            newCharm.palette = [this.getRandomColor()];
            newCharm = await this.charmRepository.save(newCharm);
            user.charm = newCharm;
            user = await this.userRepository.save(user);
        }
        return user;
    }

    public async addColor(username: string): Promise<User> {
        const user = await this.userRepository.findOne(username, { relations: ['charm'] });

        const cost = this.COSTS.color(user.charm.palette.length);
        if (user.currency >= cost) {
            await this.userService.adjustCurrency(username, -cost);
            user.charm.palette.push(this.getRandomColor());
        }

        await this.charmRepository.save(user.charm);
        return user;
    }

    public async addPixel(username: string): Promise<User> {
        const user = await this.userRepository.findOne(username, { relations: ['charm'] });

        const currentSize = Math.sqrt(user.charm.charm.length);
        const cost = this.COSTS.pixel(currentSize);
        if (user.currency >= cost) {
            await this.userService.adjustCurrency(username, -cost);
            user.charm.charm = [...Array(Math.pow(currentSize + 1, 2))].fill(0);
        }

        await this.charmRepository.save(user.charm);
        return user;
    }

    public async reroll(username: string, paletteIndex: number): Promise<User> {
        const user = await this.userRepository.findOne(username, { relations: ['charm'] });

        const cost = this.COSTS.reroll(0);
        if (paletteIndex < user.charm.palette.length && user.currency >= cost) {
            await this.userService.adjustCurrency(username, -cost);
            user.charm.palette[paletteIndex] = this.getRandomColor();
        }

        await this.charmRepository.save(user.charm);
        return user;
    }

    public async save(username: string, charm: number[]): Promise<User> {
        const user = await this.userRepository.findOne(username, { relations: ['charm'] });

        if (charm.length === user.charm.charm.length) {
            user.charm.charm = charm;
        }

        await this.charmRepository.save(user.charm);
        return user;
    }

    public find(): Promise<Charm[]> {
        return this.charmRepository.find({ relations: ['user'] });
    }

    public async create(charm: Charm): Promise<Charm> {
        this.log.info('Create a new charm => ', charm.toString());
        const newCharm = await this.charmRepository.save(charm);
        return newCharm;
    }

    public async delete(name: string): Promise<void> {
        this.log.info('Delete a charm');
        await this.charmRepository.delete(name);
        return;
    }

    private getRandomColor(): string {
        const hexChars = [...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        return '#' + hexChars;
    }

}
