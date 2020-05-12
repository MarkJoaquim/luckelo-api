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

}
