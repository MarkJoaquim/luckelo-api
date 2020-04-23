import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Elo } from '../models/Elo';
import { EloRepository } from '../repositories/EloRepository';
import { events } from '../subscribers/events';
import { User } from '../models/User';
import { Game } from '../models/Game';

@Service()
export class EloService {

    constructor(
        @OrmRepository() private eloRepository: EloRepository,
        @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public findOne(username: string, game: string): Promise<Elo | undefined> {
        this.log.info('Find one rating');
        return this.eloRepository.findOne({ username, game });
    }

    public find(): Promise<Elo[]> {
        return this.eloRepository.find();
    }

    public findByUser(user: User): Promise<Elo[]> {
        return this.eloRepository.find({ where: { username: user.username }});
    }

    public findByGame(game: Game): Promise<Elo[]> {
        return this.eloRepository.find({ where: { game: game.name }});
    }

    public async create(elo: Elo): Promise<Elo> {
        this.log.info('Create a new rating => ', elo.toString());
        const newElo = await this.eloRepository.save(elo);
        this.eventDispatcher.dispatch(events.elo.created, newElo);
        return newElo;
    }

    public async update(elo: Elo): Promise<Elo> {
        return await this.eloRepository.save(elo);
    }

    public async victory(eloWinner: Elo, eloLoser: Elo): Promise<boolean> {

        // get and adjust the two ratings accordingly

        return true;
    }
}
