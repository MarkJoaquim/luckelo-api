import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { PokerMatchRepository } from '../repositories/PokerMatchRepository';
import { PokerMatch } from '../models/PokerMatch';
import { nanoid } from 'nanoid/non-secure';
import { Logger, LoggerInterface } from '../../decorators/Logger';

@Service()
export class PokerMatchService {

    constructor(
        @OrmRepository() private pokerMatchRepository: PokerMatchRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async find(): Promise<PokerMatch[]> {
        return await this.pokerMatchRepository.find();
    }

    public async findRoomsInList(rooms: string[]): Promise<any[]> {
        const pokerMatches = await this.pokerMatchRepository
                .createQueryBuilder('match')
                .leftJoinAndSelect('match.player1', 'player1')
                .leftJoinAndSelect('match.player2', 'player2')
                .where('match.room IN (:...rooms)', { rooms })
                .andWhere(qb => {
                    const sq = qb.subQuery()
                        .select('match.id')
                        .from(PokerMatch, 'match2')
                        .where('match2.room = match.room')
                        .andWhere('match2.id > match.id')
                        .getQuery();
                    return 'not exists ' + sq;
                })
                .getMany();
        // Adding gameName to
        return pokerMatches.map(match => {
            (match as any).gameName = 'Poker';
            return match;
        });
    }

    public async findByRoom(room: string): Promise<PokerMatch> {
        return await this.pokerMatchRepository.findOne({
            relations: ['player1', 'player2'],
            where: { room },
            order: { id: 'DESC' },
        });
    }

    public async matchHistory(username: string): Promise<PokerMatch[]> {
        return await this.pokerMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .leftJoinAndSelect('match.player2', 'player2')
            .where('player1.outcome is not null')
            .andWhere('(player1.username = :username OR player2.username = :username)', { username })
            .orderBy('match.created', 'DESC')
            .getMany();
    }

    public async matchHistoryBetween(player1: string, player2: string): Promise<PokerMatch[]> {
        return await this.pokerMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'p1')
            .leftJoinAndSelect('match.player2', 'p2')
            .where('p1.outcome is not null')
            .andWhere('(p1.username = :p1 AND p2.username = :p2) OR (p1.username = :p2 AND p2.username = :p1)', { p1: player1, p2: player2 })
            .getMany();
    }

    public async findActive(): Promise<PokerMatch[]> {
        return await this.pokerMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .where('player1.outcome is null')
            .getMany();
    }

    public async findActiveByRoom(room: string): Promise<PokerMatch> {
        return await this.pokerMatchRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.player1', 'player1')
            .leftJoinAndSelect('match.player2', 'player2')
            .where('match.room = :room', { room })
            .andWhere('player1.outcome is null')
            .orderBy('match.id', 'DESC')
            .getOne();
    }

    public async createInNewRoom(match: PokerMatch): Promise<string> {
        match.room = nanoid(8);
        const createdMatch = await this.pokerMatchRepository.save(match);

        this.log.info(JSON.stringify(createdMatch));
        return match.room;
    }

    public async createInExistingRoom(room: string, match: PokerMatch): Promise<PokerMatch> {
        match.room = room;
        const createdMatch = await this.pokerMatchRepository.save(match);

        return createdMatch;
    }

    public async update(match: PokerMatch): Promise<PokerMatch> {
        return await this.pokerMatchRepository.save(match);
    }

}
