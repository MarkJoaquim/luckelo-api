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
            relations: ['player1', 'player1.user', 'player1.user.charm', 'player2', 'player2.user', 'player2.user.charm'],
            where: { room },
            order: { id: 'DESC' },
        });
    }

    public async matchHistory(username: string): Promise<UrMatch[]> {
        return await this.urMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .leftJoinAndSelect('match.player2', 'player2')
            .where('player1.outcome is not null')
            .andWhere('(player1.username = :username OR player2.username = :username)', { username })
            .orderBy('match.created', 'DESC')
            .getMany();
    }

    public async matchHistoryBetween(player1: string, player2: string): Promise<UrMatch[]> {
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
            .leftJoinAndSelect('player1.user', 'user1')
            .leftJoinAndSelect('user1.charm', 'charm1')
            .leftJoinAndSelect('match.player2', 'player2')
            .leftJoinAndSelect('player2.user', 'user2')
            .leftJoinAndSelect('user2.charm', 'charm2')
            .where('match.room = :room', { room })
            .andWhere('player1.outcome is null')
            .orderBy('match.id', 'DESC')
            .getOne();
    }

    public async createInNewRoom(match: UrMatch): Promise<string> {
        match.room = nanoid(8);
        const createdMatch = await this.urMatchRepository.save(match);

        this.log.info(JSON.stringify(createdMatch));
        return match.room;
    }

    public async createInExistingRoom(room: string, match: UrMatch): Promise<UrMatch> {
        match.room = room;
        await this.urMatchRepository.save(match);

        return await this.findActiveByRoom(room);
    }

    public async update(match: UrMatch): Promise<UrMatch> {
        return await this.urMatchRepository.save(match);
    }

}
