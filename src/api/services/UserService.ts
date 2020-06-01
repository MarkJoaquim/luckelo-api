import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { events } from '../subscribers/events';
import { UsernameTakenError } from '../errors/UsernameTakenError';
import { UserNotFoundError } from '../errors/UserNotFoundError';

@Service()
export class UserService {
    private CURRENCY_REWARD_SCALE: Record<string, number> = {
        Ur: 2,
        Balderdash: 0.5,
        Dice: 0.25,
        Poker: 1,
    };

    constructor(
        @OrmRepository() private userRepository: UserRepository,
        @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public findOne(username: string): Promise<User | undefined> {
        this.log.info('Find one user');
        return this.userRepository.findOne({ username });
    }

    public find(): Promise<User[]> {
        return this.userRepository.find();
    }

    public async validate(username: string, password: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ username });
        if (user) {
            return await User.comparePassword(user, password);
        }

        throw new UserNotFoundError();
    }

    public async create(user: User): Promise<User> {
        this.log.info('Create a new user => ', user.toString());
        try {
            await user.hashPassword();
            const result = await this.userRepository.insert(user);
            const newUser = result.identifiers[0] as User;
            this.eventDispatcher.dispatch(events.user.created, newUser);
            return newUser;
        } catch (err) {
            throw new UsernameTakenError();
        }
    }

    public async delete(username: string): Promise<void> {
        this.log.info('Delete a user');
        await this.userRepository.delete(username);
        return;
    }

    public async adjustCurrencyAfterGame(username: string, game: string, eloChange: number): Promise<void> {
        if (eloChange > 0) {
            const value = eloChange * this.CURRENCY_REWARD_SCALE[game];
            this.adjustCurrency(username, value);
        }
    }

    public async adjustCurrency(username: string, amount: number): Promise<void> {
        await this.userRepository.createQueryBuilder()
            .update(User)
            .set({ currency: () => `currency + ${Math.floor(amount)}`})
            .where('username = :username', { username })
            .execute();
    }
}
