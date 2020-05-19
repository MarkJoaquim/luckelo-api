import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Elo } from '../models/Elo';
import { EloRepository } from '../repositories/EloRepository';
import { events } from '../subscribers/events';
import { User } from '../models/User';

@Service()
export class EloService {
    private K = 32;

    constructor(
        @OrmRepository() private eloRepository: EloRepository,
        @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async findOne(username: string, game: string): Promise<Elo> {
        this.log.info('Find one rating');
        let elo = await this.eloRepository.findOne({ username, game });
        if (!elo) {
            elo = new Elo(username, game);
            this.create(elo);
        }
        return elo;
    }

    public find(): Promise<Elo[]> {
        return this.eloRepository.find();
    }

    public findByUser(user: User): Promise<Elo[]> {
        return this.eloRepository.find({ where: { username: user.username }});
    }

    public findByGame(game: string): Promise<Elo[]> {
        const options: any = {
            where: { game },
            order: {
                elo: 'DESC',
            },
        };
        return this.eloRepository.find(options);
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

    public async adjust(game: string, player1: string, player2: string, draw: boolean = false): Promise<Record<string, number>> {
        const player1Elo = await this.findOne(player1, game);
        const player2Elo = await this.findOne(player2, game);

        const p1Expected = this.getExpectedScore(player1Elo.elo, player2Elo.elo);
        const p2Expected = 1 - p1Expected;

        if (draw) {
            player1Elo.elo += Math.round(this.K * (0.5 - p1Expected));
            player2Elo.elo += Math.round(this.K * (0.5 - p2Expected));
        } else {
            player1Elo.elo += Math.round(this.K * (1 - p1Expected));
            player2Elo.elo += Math.round(this.K * (0 - p1Expected));
        }

        await this.eloRepository.save(player1Elo);
        await this.eloRepository.save(player2Elo);

        const result: Record<string, number> = {};
        result[player1] = player1Elo.elo;
        result[player2] = player2Elo.elo;
        return result;
    }

    private getExpectedScore(playerElo: number, opponentElo: number): number {
        return Math.pow(1 + Math.pow(10, (opponentElo - playerElo) / 400), -1);
    }
}
