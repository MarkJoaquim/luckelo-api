import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { DiceMatchRepository } from '../repositories/DiceMatchRepository';
import { DiceMatch } from '../models/DiceMatch';
import { nanoid } from 'nanoid/non-secure';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { DicePlayerRepository } from '../repositories/DicePlayerRepository';

@Service()
export class DiceMatchService {

    constructor(
        @OrmRepository() private diceMatchRepository: DiceMatchRepository,
        @OrmRepository() private dicePlayerRepository: DicePlayerRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async find(): Promise<DiceMatch[]> {
        return await this.diceMatchRepository.find();
    }

    public async findRoomsInList(rooms: string[]): Promise<DiceMatch[]> {
        return await this.diceMatchRepository
                .createQueryBuilder('match')
                .leftJoinAndSelect('match.players', 'player')
                .where('match.room IN (:...rooms)', { rooms })
                .andWhere(qb => {
                    const sq = qb.subQuery()
                        .select('match.id')
                        .from(DiceMatch, 'match2')
                        .where('match2.room = match.room', { rooms })
                        .andWhere('match2.id > match.id')
                        .getQuery();
                    return 'not exists ' + sq;
                })
                .getMany();
    }

    public async findByRoom(room: string): Promise<DiceMatch> {
        return await this.diceMatchRepository.findOne({
            relations: ['players'],
            where: { room },
            order: { id: 'DESC' },
        });
    }

    public async matchHistory(username: string): Promise<DiceMatch[]> {
        return await this.diceMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'player')
            .where(qb => {
                const sq = qb.subQuery()
                    .select('match.id')
                    .from(DiceMatch, 'match')
                    .leftJoin('match.players', 'player')
                    .where('player.username = :username', { username })
                    .andWhere('player.outcome is not null')
                    .getQuery();
                return 'match.id IN ' + sq;
            })
            .orderBy('match.created', 'DESC')
            .getMany();
    }

    public async matchHistoryBetween(player1: string, player2: string): Promise<DiceMatch[]> {
        return await this.diceMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'p1')
            .leftJoinAndSelect('match.players', 'p2')
            .where('p1.outcome is not null')
            .andWhere('(p1.username = :p1 AND p2.username = :p2) OR (p1.username = :p2 AND p2.username = :p1)', { p1: player1, p2: player2 })
            .getMany();
    }

    public async findActive(): Promise<DiceMatch[]> {
        return await this.diceMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'player')
            .where('player.outcome is null')
            .getMany();
    }

    public async findActiveByRoom(room: string): Promise<DiceMatch> {
        return await this.diceMatchRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'player')
            .where('match.room = :room', { room })
            .andWhere('player.outcome is null')
            .orderBy('match.id', 'DESC')
            .getOne();
    }

    public async createInNewRoom(match: DiceMatch): Promise<string> {
        match.room = nanoid(8);
        const createdMatch = await this.diceMatchRepository.save(match);
        this.log.info(JSON.stringify(createdMatch));
        await Promise.all(createdMatch.players.map(async player => {
            player.matchId = createdMatch.id;
            await this.dicePlayerRepository.save(player);
        }));
        return match.room;
    }

    public async createInExistingRoom(room: string, match: DiceMatch): Promise<DiceMatch> {
        match.room = room;
        const createdMatch = await this.diceMatchRepository.save(match);
        await Promise.all(createdMatch.players.map(async player => {
            player.matchId = createdMatch.id;
            await this.dicePlayerRepository.save(player);
        }));
        return createdMatch;
    }

    public async update(match: DiceMatch): Promise<DiceMatch> {
        const matchCopy = { ...match };

        await Promise.all(matchCopy.players.map(async player => {
            await this.dicePlayerRepository.save(player);
        }));

        // Have to delete the relation or else it tries to save it and fails.
        delete matchCopy.players;
        await this.diceMatchRepository.update(matchCopy.id, matchCopy);

        return match;
    }

}
