import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { MatchRepository } from '../repositories/MatchRepository';
import { Match } from '../models/Match';
import { nanoid } from 'nanoid/non-secure';
import { UpdateResult } from 'typeorm';
import { RoomRepository } from '../repositories/RoomRepository';
import { Room } from '../models/Room';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { DicePlayerRepository } from '../repositories/DicePlayerRepository';

@Service()
export class MatchService {

    constructor(
        @OrmRepository() private matchRepository: MatchRepository,
        @OrmRepository() private roomRepository: RoomRepository,
        @OrmRepository() private dicePlayerRepository: DicePlayerRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async find(): Promise<Match[]> {
        return await this.matchRepository.find();
    }

    public async findRooms(): Promise<Room[]> {
        return await this.roomRepository.find();
    }

    public async findByRoom(room: string): Promise<Match> {
        try {
            return (await this.roomRepository.findOne(room, {
                relations: ['match', 'match.dicePlayers'],
                order: { matchId: 'DESC' },
            })).match;
                // .createQueryBuilder('room')
                // .leftJoinAndSelect('room.match', 'match')
                // .leftJoinAndSelect('match.dicePlayers', 'player')
                // .where('room.room = :room', { room })
                // .orderBy('match.id', 'DESC')
                // .getOne()).match;
            // return (await getManager()
            //     .createQueryBuilder(Match, 'match')
            //     .leftJoinAndSelect(DicePlayer, 'dice_player', 'dice_player.matchId = match.id')
            //     .orderBy('match.id', 'DESC')
            //     .getOne());
        } catch (err) {
            this.log.error(err);
        }
        return undefined;
    }

    public async matchHistory(game: string, username: string): Promise<Match[]> {
        if (game.toLowerCase() === 'dice') {
            return await this.matchRepository
                .createQueryBuilder('match')
                .leftJoinAndSelect('match.dicePlayers', 'player')
                .where(qb => {
                    const sq = qb.subQuery()
                        .select('match.id')
                        .from(Match, 'match')
                        .leftJoin('match.dicePlayers', 'player')
                        .where('player.username = :username', { username })
                        .andWhere('player.outcome is not null')
                        .getQuery();
                    return 'match.id IN ' + sq;
                })
                .orderBy('match.created', 'DESC')
                .getMany();
        }
        return undefined;
    }

    public async matchHistoryBetween(game: string, player1: string, player2: string): Promise<Match[]> {
        if (game.toLowerCase() === 'dice') {
            return await this.matchRepository
                .createQueryBuilder('match')
                .leftJoinAndSelect('match.dicePlayers', 'p1')
                .leftJoinAndSelect('match.dicePlayers', 'p2')
                .where('p1.outcome is not null')
                .andWhere('(p1.username = :p1 AND p2.username = :p2) OR (p1.username = :p2 AND p2.username = :p1)', { p1: player1, p2: player2 })
                .getMany();
        }
        return undefined;
    }

    public async findActive(): Promise<Match[]> {
        return await this.matchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.dicePlayers', 'player')
            .where('player.outcome is null')
            .getMany();
    }

    public async findActiveByRoom(room: string): Promise<Match> {
        const diceRoom = await this.roomRepository.createQueryBuilder('room')
            .leftJoinAndSelect('room.match', 'match')
            .leftJoinAndSelect('match.dicePlayers', 'player')
            .where('room.room = :room', { room })
            .andWhere('player.outcome is null')
            .getOne();
        this.log.info(JSON.stringify(diceRoom));

        return diceRoom ? diceRoom.match : undefined;
    }

    public async createInNewRoom(match: Match): Promise<string> {
        try {
            const createdMatch = await this.matchRepository.save(match);
            this.log.info(JSON.stringify(createdMatch));
            createdMatch.dicePlayers.forEach(player => {
                player.matchId = createdMatch.id;
                this.dicePlayerRepository.save(player);
            });
            const room = new Room();
            room.room = nanoid(8);
            room.matchId = createdMatch.id;
            return (await this.roomRepository.save(room)).room;
        } catch (err) {
            this.log.error(err);
        }
        return undefined;
    }

    public async createInExistingRoom(room: string, match: Match): Promise<Match> {
        const createdMatch = await this.matchRepository.save(match);
        createdMatch.dicePlayers.forEach(player => {
            player.matchId = createdMatch.id;
            this.dicePlayerRepository.save(player);
        });
        const existingRoom = await this.roomRepository.findOne(room);
        existingRoom.matchId = createdMatch.id;
        await this.roomRepository.save(existingRoom);
        return createdMatch;
    }

    public async update(match: Match): Promise<UpdateResult> {
        match.dicePlayers.forEach(player => {
            this.dicePlayerRepository.save(player);
        });
        return await this.matchRepository.update(match.id, match);
    }

}
