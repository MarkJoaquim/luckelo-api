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
    private BLANK_SPACE = '-';
    private STARTING_PIECES = 7;
    private NUMBER_OF_LOTS = 4;
    private ROSETTES = new Set([3, 7, 13]);
    private PLAYER_SPECIFICS = {
        one: {
            piece: '1',
            opponent: '2',
            spaces: new Set([0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20]),
            getRelativeState: (state) => [...state.slice(0, 4), ...state.slice(8, 18)],
            getRelativeMove: (globalMove) => globalMove === 20 ? 14 : (globalMove - (globalMove >= 8 ? 4 : 0)),
            getGlobalMove: (move) => move + (move > 3 ? 4 : 0),
        },
        two: {
            piece: '2',
            opponent: '1',
            spaces: new Set([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20]),
            getRelativeState: (state) => [...state.slice(4, 16), ...state.slice(18)],
            getRelativeMove: (globalMove) => globalMove - 4 - (globalMove >= 18 ? 2 : 0),
            getGlobalMove: (move) => move + 4 + (move > 11 ? 2 : 0),
        },
    };

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
        match.boardState = this.BLANK_SPACE.repeat(20);
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

        if (this.handleMove(match, username, globalMove)) {
            if (this.timeouts[room] !== undefined) {
                this.timeouts[room].forEach(timeout => clearTimeout(timeout));
                this.timeouts[room] = [];
            }

            if (match.player1.piecesHome === 7 || match.player2.piecesHome === 7) {
                await this.gameOver(match);
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
            io.to(room).emit('ur moves', this.validMovesInMatch(match));
        }
    }

    public validMovesInMatch(match: UrMatch): number[]  {
        let moveSet = new Set<number>();
        if (match.player1.turn) {
            moveSet = this.validMoves(match.player1, match.boardState.split(''), this.PLAYER_SPECIFICS.one);
        } else if (match.player2.turn) {
            moveSet = this.validMoves(match.player2, match.boardState.split(''), this.PLAYER_SPECIFICS.two);
        }
        return Array.from(moveSet);
    }

    public handleMove(match: UrMatch, username: string, globalMove: number): boolean {
        const globalState = match.boardState.split('');
        let mover: UrPlayer;
        let other: UrPlayer;
        let specs: any;
        if (match.player1.username === username && match.player1.turn) {
            mover = match.player1;
            other = match.player2;
            specs = this.PLAYER_SPECIFICS.one;
        } else if (match.player2.username === username && match.player2.turn) {
            mover = match.player2;
            other = match.player1;
            specs = this.PLAYER_SPECIFICS.two;
        }

        if (specs.spaces.has(globalMove)) {
            const move = specs.getRelativeMove(globalMove);
            const validMoves = this.validMoves(mover, globalState, specs);
            if (validMoves.has(globalMove)) {
                const movedFrom = move - mover.roll;
                const globalMovedFrom = specs.getGlobalMove(movedFrom);

                if (move === 14) {
                    mover.piecesHome++;
                } else {
                    if (globalState[globalMove] === specs.opponent) {
                        other.piecesAtStart++;
                    }
                    globalState[globalMove] = specs.piece;
                }

                if (movedFrom === -1) {
                    mover.piecesAtStart--;
                } else {
                    globalState[globalMovedFrom] = this.BLANK_SPACE;
                }

                if (this.ROSETTES.has(move)) {
                    mover.roll = this.roll();
                } else {
                    other.roll = this.roll();
                    other.turn = true;
                    mover.turn = false;
                }

                match.boardState = globalState.join('');
                return true;
            } else if (validMoves.size === 0) {
                other.roll = this.roll();
                other.turn = true;
                mover.turn = false;

                return true;
            }
        }

        return false;
    }

    public validMoves(player: UrPlayer, globalState: string[], specs: any): Set<number> {
        const roll = player.roll;
        const state = specs.getRelativeState(globalState);
        const piece = specs.piece;
        const validMoves = new Set<number>();

        if (roll === 0) {
            return validMoves;
        }

        if (player.piecesAtStart && state[roll - 1] !== piece) {
            validMoves.add(specs.getGlobalMove(roll - 1));
        }

        for (let i = 0; i < 14; i++) {
            const val = state[i];
            if (val === piece) {
                if (i + roll === 14) {
                    validMoves.add(20);
                } else if (i + roll < 14
                    && (state[i + roll] === this.BLANK_SPACE || (state[i + roll] !== piece && !this.ROSETTES.has(i + roll)))) {
                    validMoves.add(specs.getGlobalMove(i + roll));
                }
            }
        }

        return validMoves;
    }

    public async gameOver(match: UrMatch): Promise<UrMatch> {
        const p1 = match.player1;
        const p2 = match.player2;

        let newElos;
        p1.turn = false;
        p2.turn = false;
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
            io.to(room).emit('ur moves', this.validMovesInMatch(newMatch));
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
