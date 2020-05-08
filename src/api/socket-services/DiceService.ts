import { Service } from 'typedi';
import { MatchDetails } from '../socket-controllers/interfaces';
import { RandomService } from '../services/RandomService';
import { EloService } from '../services/EloService';
import { MatchService } from '../services/MatchService';
import { Match } from '../models/Match';
import { Logger, LoggerInterface } from '../../../src/decorators/Logger';
import { DicePlayer } from '../models/DicePlayer';

@Service()
export class DiceService {
    public rolls: number[] = [];
    public timeouts: Record<string, NodeJS.Timeout[]> = {};
    private TURN_TIME_LIMIT = 30000;
    private WARNING_TIME = 5000;

    constructor(
        public randomService: RandomService,
        public eloService: EloService,
        public matchService: MatchService,
        @Logger(__filename) private log: LoggerInterface) {
            this.randomService.getRandomNumbers(1, 6, 6).then(rolls => this.rolls.push(...rolls));
        }

    public async createGame(matchDetails: MatchDetails): Promise<string> {
        const match = new Match();
        match.dicePlayers = matchDetails.players.map(player => {
            const dicePlayer = new DicePlayer();
            dicePlayer.username = player.username;
            dicePlayer.initialElo = player.elo;
            return dicePlayer;
        });
        match.gameName = 'dice';
        this.log.info(JSON.stringify(match));
        return await this.matchService.createInNewRoom(match);
    }

    public async getMatch(room: string): Promise<Match> {
        return await this.matchService.findByRoom(room);
    }

    public async roll(io: any, username: string, room: string): Promise<void> {
        let match: Match = await this.matchService.findActiveByRoom(room);

        let diceRollResult;
        match.dicePlayers.forEach(player => {
            if (player.username === username && !player.roll) {
                player.roll = this.rolls.pop();
                diceRollResult = { username, roll: player.roll };
            }
        });

        if (diceRollResult !== undefined) {
            // Clear all timeouts to kill this room
            if (this.timeouts[room] !== undefined) {
                this.timeouts[room].forEach(timeout => clearTimeout(timeout));
                this.timeouts[room] = [];
            }

            io.to(room).emit('dice rollResult', diceRollResult);

            // TODO: better way of assuring this match wasn't already completed.
            if (match.dicePlayers.findIndex(player => !player.roll) === -1) {
                match = await this.gameOver(match);
                io.to(room).emit('dice match', match);
            } else {
                const newTimeouts = [
                    setTimeout(() => this.sendForcedEndWarning(io, room), this.TURN_TIME_LIMIT - this.WARNING_TIME),
                    setTimeout(() => this.forceEnd(io, room), this.TURN_TIME_LIMIT),
                ];
                if (this.timeouts[room] === undefined) {
                    this.timeouts[room] = newTimeouts;
                } else {
                    this.timeouts[room].push(...newTimeouts);
                }
            }

            this.matchService.update(match);

            if (this.rolls.length < 3) {
                this.rolls.push(...await this.randomService.getRandomNumbers(1, 6, 6));
            }
        }
    }

    public async gameOver(match: Match): Promise<Match> {
        const p1 = match.dicePlayers[0];
        const p2 = match.dicePlayers[1];

        let newElos;
        if (p1.roll === p2.roll) {
            p1.outcome = 'Draw';
            p2.outcome = 'Draw';
            newElos = await this.eloService.adjust('dice', p1.username, p2.username, true);
        } else if (p1.roll > p2.roll) {
            p1.outcome = 'Victory';
            p2.outcome = 'Defeat';
            newElos = await this.eloService.adjust('dice', p1.username, p2.username);
        } else {
            p1.outcome = 'Defeat';
            p2.outcome = 'Victory';
            newElos = await this.eloService.adjust('dice', p2.username, p1.username);
        }

        p1.finalElo = newElos[p1.username];
        p2.finalElo = newElos[p2.username];

        return match;
    }

    public async requestRematch(io: any, username: string, room: string): Promise<void> {
        const match = await this.matchService.findByRoom(room);

        match.dicePlayers.forEach(player => {
            if (player.username === username) {
                player.rematchRequested = true;
            }
        });

        this.matchService.update(match);

        if (match.dicePlayers.find(player => !player.rematchRequested) === undefined) {
            let newMatch = new Match();
            newMatch.dicePlayers = match.dicePlayers.map(player => {
                const dicePlayer = new DicePlayer();
                dicePlayer.username = player.username;
                dicePlayer.initialElo = player.finalElo;
                return dicePlayer;
            });
            newMatch.gameName = 'dice';
            newMatch = await this.matchService.createInExistingRoom(room, newMatch);

            io.to(room).emit('dice newMatch', newMatch);
        } else {
            io.to(room).emit('dice rematch', { username });
        }
    }

    public async sendForcedEndWarning(io: any, room: string): Promise<void> {
        io.to(room).emit('dice matchEnding', { timeRemaining: this.WARNING_TIME });
    }

    public async forceEnd(io: any, room: string): Promise<void> {
        let match: Match = await this.matchService.findByRoom(room);

        match = await this.gameOver(match);

        io.to(room).emit('dice match', match);

        await this.matchService.update(match);
    }
}
