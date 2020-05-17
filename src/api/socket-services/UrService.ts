import { Service } from 'typedi';
import { MatchDetails, Player } from '../socket-controllers/interfaces';
import { RandomService } from '../services/RandomService';
import { EloService } from '../services/EloService';
import { UrMatchService } from '../services/UrMatchService';
import { UrMatch } from '../models/UrMatch';
import { Logger, LoggerInterface } from '../../../src/decorators/Logger';
import { UrPlayer } from '../models/UrPlayer';

@Service()
export class UrService {
    public rolls: number[] = [];
    public timeouts: Record<string, NodeJS.Timeout[]> = {};
    // private TURN_TIME_LIMIT = 30000;
    private WARNING_TIME = 5000;
    private gameName = 'Ur';
    private STARTING_PIECES = 7;
    private NUMBER_OF_LOTS = 4;
    private ROSETTES = new Set([3, 7, 13]);

    constructor(
        public randomService: RandomService,
        public eloService: EloService,
        public urMatchService: UrMatchService,
        @Logger(__filename) private log: LoggerInterface) {
            this.randomService.getRandomNumbers(0, 1, 24).then(rolls => this.rolls.push(...rolls));
        }

    public async createGame(matchDetails: MatchDetails): Promise<string> {
        const match = this.createUrMatch(matchDetails.players[0], matchDetails.players[1]);

        this.log.info(JSON.stringify(match));
        return await this.urMatchService.createInNewRoom(match);
    }

    public createUrMatch(p1: Player, p2: Player): UrMatch {
        const match = new UrMatch();
        match.player1 = new UrPlayer();
        match.player1.username = p1.username;
        match.player1.initialElo = p1.elo;
        match.player1.turn = true;
        match.player1.piecesAtStart = this.STARTING_PIECES;
        match.player1.piecesHome = 0;
        match.player1.roll = this.roll();

        match.player2 = new UrPlayer();
        match.player2.username = p2.username;
        match.player2.initialElo = p2.elo;
        match.player2.turn = false;
        match.player2.piecesAtStart = this.STARTING_PIECES;
        match.player2.piecesHome = 0;

        match.gameName = this.gameName;
        match.boardState = '-'.repeat(20);
        return match;
    }

    public async getMatch(room: string): Promise<UrMatch> {
        return await this.urMatchService.findByRoom(room);
    }

    public roll(): number {
        let result = 0;
        for (let i = 0; i < this.NUMBER_OF_LOTS; i++) {
            result += this.rolls.pop();
        }
        if (this.rolls.length < 12) {
            this.randomService.getRandomNumbers(0, 1, 24).then(rolls => this.rolls.push(...rolls));
        }
        return result;
    }

    public async move(io: any, username: string, room: string, globalMove: number): Promise<void> {
        const match: UrMatch = await this.urMatchService.findActiveByRoom(room);
        const state = match.boardState.split('');

        this.log.info(JSON.stringify(match));
        this.log.info('' + globalMove);

        if (match.player1.username === username && match.player1.turn) {
            const move = globalMove === 20 ? 14 : (globalMove - (globalMove >= 8 ? 4 : 0));
            const p1state = [...state.slice(0, 4), ...state.slice(8, 18)];
            this.log.info('' + move);
            this.log.info(JSON.stringify(p1state));
            const landingSquareValid = move === 14 || (p1state[move] !== '1' && !this.ROSETTES.has(move)) || p1state[move] === '-';
            const leavingSquareValid = (move - match.player1.roll === -1 && match.player1.piecesAtStart > 0) || p1state[move - match.player1.roll] === '1';
            if (landingSquareValid && leavingSquareValid) {
                const movedFrom = move - match.player1.roll;
                const globalMovedFrom = movedFrom + (movedFrom > 3 ? 4 : 0);

                if (move === 14) {
                    match.player1.piecesHome++;
                } else {
                    state[globalMove] = '1';
                }

                if (globalMovedFrom >= 0) {
                    state[globalMovedFrom] = '-';
                } else {
                    match.player1.piecesAtStart--;
                }

                match.boardState = state.join('');

                if (this.ROSETTES.has(move)) {
                    match.player1.roll = this.roll();
                } else {
                    if (p1state[move] === '2') {
                        match.player2.piecesAtStart++;
                    }
                    match.player2.roll = this.roll();
                    match.player2.turn = true;
                    match.player1.turn = false;
                }
            } else if (!this.validMoveExists('1', match.player1.roll, p1state, match.player1.piecesAtStart)) {
                match.player2.roll = this.roll();
                match.player2.turn = true;
                match.player1.turn = false;
            }
        } else if (match.player2.username === username && match.player2.turn) {
            const move = globalMove - 4 - (globalMove >= 18 ? 2 : 0);
            const p2state = [...state.slice(4, 16), ...state.slice(18)];
            this.log.info('' + move);
            this.log.info(JSON.stringify(p2state));
            const landingSquareValid = move === 14 || (p2state[move] !== '2' && !this.ROSETTES.has(move)) || p2state[move] === '-';
            const leavingSquareValid = (move - match.player2.roll === -1 && match.player2.piecesAtStart > 0) || p2state[move - match.player2.roll] === '2';
            if (landingSquareValid && leavingSquareValid) {
                const movedFrom = move - match.player2.roll;
                const globalMovedFrom = movedFrom + 4 + (movedFrom > 11 ? 2 : 0);

                if (move === 14) {
                    match.player2.piecesHome++;
                } else {
                    state[globalMove] = '2';
                }

                if (globalMovedFrom >= 4) {
                    state[globalMovedFrom] = '-';
                } else {
                    match.player2.piecesAtStart--;
                }

                match.boardState = state.join('');

                if (this.ROSETTES.has(move)) {
                    match.player2.roll = this.roll();
                } else {
                    if (p2state[move] === '1') {
                        match.player1.piecesAtStart++;
                    }
                    match.player1.roll = this.roll();
                    match.player1.turn = true;
                    match.player2.turn = false;
                }
            } else if (!this.validMoveExists('2', match.player2.roll, p2state, match.player2.piecesAtStart)) {
                match.player1.roll = this.roll();
                match.player1.turn = true;
                match.player2.turn = false;
            }
        } else {
            return;
        }

        if (this.timeouts[room] !== undefined) {
            this.timeouts[room].forEach(timeout => clearTimeout(timeout));
            this.timeouts[room] = [];
        }

        if (match.player1.piecesHome === 7 || match.player2.piecesHome === 7) {
            this.gameOver(match);
        }
        // else {
            // const newTimeouts = [
            //     setTimeout(() => this.sendForcedEndWarning(io, room), this.TURN_TIME_LIMIT - this.WARNING_TIME),
            //     setTimeout(() => this.forceEnd(io, room), this.TURN_TIME_LIMIT),
            // ];
            // if (this.timeouts[room] === undefined) {
            //     this.timeouts[room] = newTimeouts;
            // } else {
            //     this.timeouts[room].push(...newTimeouts);
            // }
        // }

        io.to(room).emit('ur match', await this.urMatchService.update(match));
    }

    public validMoveExists(player: string, roll: number, relativeState: string[], piecesAtStart: number): boolean {
        this.log.info('checking for valid moves');
        if (roll === 0) {
            return false;
        }

        if (piecesAtStart && relativeState[roll - 1] !== player) {
            return true;
        }

        const validMove = relativeState.find((val, i) => {
            if (val === player) {
                if (i + roll === 14) {
                    return true;
                } if (i + roll > 14) {
                    return false;
                } else if (relativeState[i + roll] === '-') {
                    return true;
                } else if (relativeState[i + roll] !== player && !this.ROSETTES.has(i + roll)) {
                    return true;
                }
                return false;
            }
            return false;
        });

        this.log.info(JSON.stringify(validMove));

        return validMove !== undefined;
    }

    public async gameOver(match: UrMatch): Promise<UrMatch> {
        const p1 = match.player1;
        const p2 = match.player2;

        let newElos;
        if (p1.piecesHome === 7) {
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
        const match = await this.urMatchService.findByRoom(room);
        let player;
        let opponent;

        if (match.player1.username === username) {
            player = match.player1;
            opponent = match.player2;
        } else if (match.player2.username === username) {
            player = match.player2;
            opponent = match.player1;
        }

        // Find a player who doesn't have a connected socket in the room.
        const opponentConnectedSocket = Object.values(io.sockets.connected).find((socket: any) =>
            socket.user === opponent.username && socket.rooms[room] !== undefined);

        if (opponentConnectedSocket === undefined) {
            return;
        }

        player.rematchRequested = true;

        this.urMatchService.update(match);

        if (player.rematchRequested && opponent.rematchRequested) {
            const p1 = {
                username: match.player2.username,
                elo: match.player2.finalElo,
            } as Player;
            const p2 = {
                username: match.player1.username,
                elo: match.player1.finalElo,
            } as Player;
            let newMatch = this.createUrMatch(p1, p2);
            newMatch = await this.urMatchService.createInExistingRoom(room, newMatch);

            io.to(room).emit('ur match', newMatch);
        } else {
            io.to(room).emit('ur match', match);
        }
    }

    public async sendForcedEndWarning(io: any, room: string): Promise<void> {
        io.to(room).emit('ur matchEnding', { timeRemaining: this.WARNING_TIME });
    }

    public async forceEnd(io: any, room: string): Promise<void> {
        let match: UrMatch = await this.urMatchService.findByRoom(room);

        match = await this.gameOver(match);

        io.to(room).emit('ur match', match);

        await this.urMatchService.update(match);
    }
}
