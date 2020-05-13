import { Service } from 'typedi';
import { MatchDetails } from '../socket-controllers/interfaces';
import { RandomService } from '../services/RandomService';
import { EloService } from '../services/EloService';
import { DiceMatchService } from '../services/DiceMatchService';
import { DiceMatch } from '../models/DiceMatch';
import { Logger, LoggerInterface } from '../../../src/decorators/Logger';
import { DicePlayer } from '../models/DicePlayer';

@Service()
export class DiceService {
    public rolls: number[] = [];
    public timeouts: Record<string, NodeJS.Timeout[]> = {};
    private TURN_TIME_LIMIT = 30000;
    private WARNING_TIME = 5000;
    private gameName = 'Dice';

    constructor(
        public randomService: RandomService,
        public eloService: EloService,
        public diceMatchService: DiceMatchService,
        @Logger(__filename) private log: LoggerInterface) {
            this.randomService.getRandomNumbers(1, 6, 6).then(rolls => this.rolls.push(...rolls));
        }

    public async createGame(matchDetails: MatchDetails): Promise<string> {
        const match = new DiceMatch();
        match.players = matchDetails.players.map(player => {
            const dicePlayer = new DicePlayer();
            dicePlayer.username = player.username;
            dicePlayer.initialElo = player.elo;
            return dicePlayer;
        });
        match.gameName = this.gameName;
        this.log.info(JSON.stringify(match));
        return await this.diceMatchService.createInNewRoom(match);
    }

    public async getMatch(room: string): Promise<DiceMatch> {
        return await this.diceMatchService.findByRoom(room);
    }

    public async roll(io: any, username: string, room: string): Promise<void> {
        let match: DiceMatch = await this.diceMatchService.findActiveByRoom(room);

        let diceRollResult;
        match.players.forEach(player => {
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
            if (match.players.findIndex(player => !player.roll) === -1) {
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

            this.diceMatchService.update(match);

            if (this.rolls.length < 3) {
                this.rolls.push(...await this.randomService.getRandomNumbers(1, 6, 6));
            }
        }
    }

    public async gameOver(match: DiceMatch): Promise<DiceMatch> {
        const p1 = match.players[0];
        const p2 = match.players[1];

        let newElos;
        if (p1.roll === p2.roll) {
            p1.outcome = 'Draw';
            p2.outcome = 'Draw';
            newElos = await this.eloService.adjust(this.gameName, p1.username, p2.username, true);
        } else if (p1.roll > p2.roll) {
            p1.outcome = 'Victory';
            p2.outcome = 'Defeat';
            newElos = await this.eloService.adjust(this.gameName, p1.username, p2.username);
        } else {
            p1.outcome = 'Defeat';
            p2.outcome = 'Victory';
            newElos = await this.eloService.adjust(this.gameName, p2.username, p1.username);
        }

        p1.finalElo = newElos[p1.username];
        p2.finalElo = newElos[p2.username];

        return match;
    }

    public async requestRematch(io: any, username: string, room: string): Promise<void> {
        const match = await this.diceMatchService.findByRoom(room);

        // Only allow a rematch if all players are connected.
        const notConnectedPlayer = match.players.find(player => {
            // Find a player who doesn't have a connected socket in the room.
            const connectedSocket = Object.values(io.sockets.connected).find((socket: any) =>
                socket.user === player.username && socket.rooms[room] !== undefined);
            return connectedSocket === undefined;
        });
        // If any players aren't in the room, don't allow the rematch Request.
        if (notConnectedPlayer !== undefined) {
            return;
        }

        match.players.forEach(player => {
            if (player.username === username) {
                player.rematchRequested = true;
            }
        });

        this.diceMatchService.update(match);

        if (match.players.find(player => !player.rematchRequested) === undefined) {
            let newMatch = new DiceMatch();
            newMatch.players = match.players.map(player => {
                const dicePlayer = new DicePlayer();
                dicePlayer.username = player.username;
                dicePlayer.initialElo = player.finalElo;
                return dicePlayer;
            });
            newMatch.gameName = this.gameName;
            newMatch = await this.diceMatchService.createInExistingRoom(room, newMatch);

            io.to(room).emit('dice newMatch', newMatch);
        } else {
            io.to(room).emit('dice rematch', { username });
        }
    }

    public async sendForcedEndWarning(io: any, room: string): Promise<void> {
        io.to(room).emit('dice matchEnding', { timeRemaining: this.WARNING_TIME });
    }

    public async forceEnd(io: any, room: string): Promise<void> {
        let match: DiceMatch = await this.diceMatchService.findByRoom(room);

        match = await this.gameOver(match);

        io.to(room).emit('dice match', match);

        await this.diceMatchService.update(match);
    }
}
