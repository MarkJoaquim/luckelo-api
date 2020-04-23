import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Game } from '../models/Game';
import { GameRepository } from '../repositories/GameRepository';
import { events } from '../subscribers/events';

@Service()
export class GameService {

    constructor(
        @OrmRepository() private gameRepository: GameRepository,
        @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public findOne(name: string): Promise<Game | undefined> {
        this.log.info('Find one game');
        return this.gameRepository.findOne({ name });
    }

    public find(): Promise<Game[]> {
        return this.gameRepository.find({ relations: ['elos'] });
    }

    public async create(game: Game): Promise<Game> {
        this.log.info('Create a new game => ', game.toString());
        const newGame = await this.gameRepository.save(game);
        this.eventDispatcher.dispatch(events.game.created, newGame);
        return newGame;
    }

    public async delete(name: string): Promise<void> {
        this.log.info('Delete a game');
        await this.gameRepository.delete(name);
        return;
    }

}
