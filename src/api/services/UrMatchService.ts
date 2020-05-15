import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { UrMatchRepository } from '../repositories/UrMatchRepository';
import { UrMatch } from '../models/UrMatch';
import { nanoid } from 'nanoid/non-secure';
import { Logger, LoggerInterface } from '../../decorators/Logger';

@Service()
export class UrMatchService {

    constructor(
        @OrmRepository() private urMatchRepository: UrMatchRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async find(): Promise<UrMatch[]> {
        return await this.urMatchRepository.find();
    }

    public async findRoomsInList(rooms: string[]): Promise<UrMatch[]> {
        return await this.urMatchRepository
                .createQueryBuilder('match')
                .leftJoinAndSelect('match.player1', 'player1')
                .leftJoinAndSelect('match.player2', 'player2')
                .where('match.room IN (:...rooms)', { rooms })
                .andWhere(qb => {
                    const sq = qb.subQuery()
                        .select('match.id')
                        .from(UrMatch, 'match2')
                        .where('match2.room = match.room', { rooms })
                        .andWhere('match2.id > match.id')
                        .getQuery();
                    return 'not exists ' + sq;
                })
                .getMany();
    }

    public async findByRoom(room: string): Promise<UrMatch> {
        return await this.urMatchRepository.findOne({
            relations: ['player1', 'player2'],
            where: { room },
            order: { id: 'DESC' },
        });
    }

    public async matchHistory(game: string, username: string): Promise<UrMatch[]> {
        return await this.urMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .leftJoinAndSelect('match.player2', 'player2')
            .where('player1.username = :username OR player2.username = :username', { username })
            .andWhere('player1.outcome is not null')
            .orderBy('match.created', 'DESC')
            .getMany();
    }

    public async matchHistoryBetween(game: string, player1: string, player2: string): Promise<UrMatch[]> {
        return await this.urMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'p1')
            .leftJoinAndSelect('match.player2', 'p2')
            .where('p1.outcome is not null')
            .andWhere('(p1.username = :p1 AND p2.username = :p2) OR (p1.username = :p2 AND p2.username = :p1)', { p1: player1, p2: player2 })
            .getMany();
    }

    public async findActive(): Promise<UrMatch[]> {
        return await this.urMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .where('player1.outcome is null')
            .getMany();
    }

    public async findActiveByRoom(room: string): Promise<UrMatch> {
        return await this.urMatchRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .leftJoinAndSelect('match.player2', 'player2')
            .where('match.room = :room', { room })
            .andWhere('player1.outcome is null')
            .orderBy('match.id', 'DESC')
            .getOne();
    }

    public async createInNewRoom(match: UrMatch): Promise<string> {
        match.room = nanoid(8);
        try {
            const createdMatch = await this.urMatchRepository.save(match);

            this.log.info(JSON.stringify(createdMatch));
            return match.room;
        } catch (err) {
            this.log.error(err);
        }
        return undefined;
    }

    public async createInExistingRoom(room: string, match: UrMatch): Promise<UrMatch> {
        match.room = room;
        const createdMatch = await this.urMatchRepository.save(match);

        return createdMatch;
    }

    public async update(match: UrMatch): Promise<UrMatch> {
        return await this.urMatchRepository.save(match);
    }

}
