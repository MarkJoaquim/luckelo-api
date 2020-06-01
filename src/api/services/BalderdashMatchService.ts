import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { BalderdashMatchRepository } from '../repositories/BalderdashMatchRepository';
import { BalderdashMatch } from '../models/BalderdashMatch';
import { nanoid } from 'nanoid/non-secure';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { BalderdashPlayerRepository } from '../repositories/BalderdashPlayerRepository';
import { BalderdashWordRepository } from '../repositories/BalderdashWordRepository';
import { BalderdashState } from '../models/BalderdashState';
import { BalderdashPlayer } from '../models/BalderdashPlayer';

@Service()
export class BalderdashMatchService {

    constructor(
        @OrmRepository() private balderdashMatchRepository: BalderdashMatchRepository,
        @OrmRepository() private balderdashPlayerRepository: BalderdashPlayerRepository,
        @OrmRepository() private balderdashWordRepository: BalderdashWordRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async find(): Promise<BalderdashMatch[]> {
        return await this.balderdashMatchRepository.find();
    }

    public async findRoomsInList(rooms: string[]): Promise<any[]> {
        const matches = await this.balderdashMatchRepository
                .createQueryBuilder('match')
                .leftJoinAndSelect('match.players', 'player')
                .where('match.room IN (:...rooms)', { rooms })
                .andWhere(qb => {
                    const sq = qb.subQuery()
                        .select('match.id')
                        .from(BalderdashMatch, 'match2')
                        .where('match2.room = match.room', { rooms })
                        .andWhere('match2.id > match.id')
                        .getQuery();
                    return 'not exists ' + sq;
                })
                .getMany();
        // Adding gameName to
        return matches.map(match => {
            (match as any).gameName = 'Balderdash';
            return match;
        });
    }

    public async findByRoom(room: string): Promise<BalderdashMatch> {
        return await this.balderdashMatchRepository.findOne({
            relations: ['players', 'players.user', 'players.user.charm', 'word'],
            where: { room },
            order: { id: 'DESC' },
        });
    }

    public async matchHistory(username: string): Promise<BalderdashMatch[]> {
        return await this.balderdashMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'player')
            .where(qb => {
                const sq = qb.subQuery()
                    .select('match.id')
                    .from(BalderdashMatch, 'match')
                    .leftJoin('match.players', 'player')
                    .where('player.username = :username', { username })
                    .andWhere('player.outcome is not null')
                    .getQuery();
                return 'match.id IN ' + sq;
            })
            .orderBy('match.created', 'DESC')
            .getMany();
    }

    public async matchHistoryBetween(player1: string, player2: string): Promise<BalderdashMatch[]> {
        return await this.balderdashMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'p1')
            .leftJoinAndSelect('match.players', 'p2')
            .where('p1.outcome is not null')
            .andWhere('(p1.username = :p1 AND p2.username = :p2) OR (p1.username = :p2 AND p2.username = :p1)', { p1: player1, p2: player2 })
            .getMany();
    }

    public async findActive(): Promise<BalderdashMatch[]> {
        return await this.balderdashMatchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'player')
            .leftJoinAndSelect('match.word', 'word')
            .where('player.outcome is null')
            .getMany();
    }

    public async findActiveByRoom(room: string): Promise<BalderdashMatch> {
        return await this.balderdashMatchRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.players', 'player')
            .leftJoinAndSelect('player.user', 'user')
            .leftJoinAndSelect('user.charm', 'charm')
            .leftJoinAndSelect('match.word', 'word')
            .where('match.room = :room', { room })
            .andWhere('player.outcome is null')
            .orderBy('match.id', 'DESC')
            .getOne();
    }

    public async setWord(room: string): Promise<BalderdashMatch> {
        const match = await this.findActiveByRoom(room);
        match.word = await this.balderdashWordRepository.createQueryBuilder('word').orderBy('RANDOM()').getOne();
        match.state = BalderdashState.definition;
        return await this.update(match);
    }

    public async leaveMatch(player: BalderdashPlayer): Promise<void> {
        await this.balderdashPlayerRepository.update(player.id, { matchId: undefined });
    }

    public async createInNewRoom(match: BalderdashMatch): Promise<string> {
        match.room = nanoid(8);
        const createdMatch = await this.balderdashMatchRepository.save(match);
        this.log.info(JSON.stringify(createdMatch));
        await Promise.all(createdMatch.players.map(async player => {
            player.matchId = createdMatch.id;
            await this.balderdashPlayerRepository.save(player);
        }));
        return match.room;
    }

    public async createInExistingRoom(room: string, match: BalderdashMatch): Promise<BalderdashMatch> {
        match.room = room;
        const createdMatch = await this.balderdashMatchRepository.save(match);
        await Promise.all(createdMatch.players.map(async player => {
            player.matchId = createdMatch.id;
            await this.balderdashPlayerRepository.save(player);
        }));
        return await this.findActiveByRoom(room);
    }

    public async update(match: BalderdashMatch): Promise<BalderdashMatch> {
        const matchCopy = { ...match };

        await Promise.all(matchCopy.players.map(async player => {
            await this.balderdashPlayerRepository.save(player);
        }));

        // Have to delete the relation or else it tries to save it and fails.
        delete matchCopy.players;
        await this.balderdashMatchRepository.update(matchCopy.id, matchCopy);

        return match;
    }

}
