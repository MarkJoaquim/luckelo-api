import { Service } from 'typedi';
import { MatchDetails, Player } from '../socket-controllers/interfaces';
import { RandomService } from '../services/RandomService';
import { EloService } from '../services/EloService';
import { PokerMatchService } from '../services/PokerMatchService';
import { PokerMatch } from '../models/PokerMatch';
import { Logger, LoggerInterface } from '../../../src/decorators/Logger';
import { PokerPlayer } from '../models/PokerPlayer';

enum BetType {limp, raiseOrBet, check, call, shove}

@Service()
export class PokerService {
    public rolls: number[] = [];
    public timeouts: Record<string, NodeJS.Timeout[]> = {};
    // private TURN_TIME_LIMIT = 30000;
    private WARNING_TIME = 5000;
    private GAME_NAME = 'Poker';
    private INITIAL_SMALL_BLIND = 1;
    private INITIAL_BIG_BLIND = 2;
    private INITIAL_STACK = 100;

    constructor(
        public randomService: RandomService,
        public eloService: EloService,
        public pokerMatchService: PokerMatchService,
        @Logger(__filename) private log: LoggerInterface) {}

    public async createGame(matchDetails: MatchDetails): Promise<string> {
        const match = await this.createPokerMatch(matchDetails.players[0], matchDetails.players[1]);

        this.log.info(JSON.stringify(match));
        return await this.pokerMatchService.createInNewRoom(match);
    }

    public deal(n: number, match: PokerMatch): number[] {
        const result: number[] = [];
        for (let i = 0; i < n; i++) {
            result.push(match.cards.pop());
        }
        return result;
    }

    public async createPokerMatch(p1: Player, p2: Player): Promise<PokerMatch> {
        const match = new PokerMatch();
        match.bigBlind = this.INITIAL_BIG_BLIND;
        match.smallBlind = this.INITIAL_SMALL_BLIND;
        match.handsPlayed = 0;
        match.handComplete = false;

        match.player1 = new PokerPlayer();
        match.player1.username = p1.username;
        match.player1.initialElo = p1.elo;
        match.player1.stack = this.INITIAL_STACK;

        match.player2 = new PokerPlayer();
        match.player2.username = p2.username;
        match.player2.initialElo = p2.elo;
        match.player2.stack = this.INITIAL_STACK;

        return await this.freshHand(match);
    }

    public async getMatch(room: string): Promise<PokerMatch> {
        return await this.pokerMatchService.findByRoom(room);
    }

    public async bet(io: any, username: string, room: string, amount: number): Promise<void> {
        const match = await this.pokerMatchService.findActiveByRoom(room);

        const type = this.handleBet(match, username, amount);
        this.log.info(type.toString());
        if (type !== undefined) {
            this.afterBet(match, type);

            if (match.player1.stack === 0 || match.player2.stack === 0) {
                await this.gameOver(match);
            }

            io.to(room).emit('poker match', await this.pokerMatchService.update(match));
        }
    }

    public handleBet(match: PokerMatch, username: string, amount: number): BetType {
        let better: PokerPlayer;
        let other: PokerPlayer;
        if (match.player1.username === username && match.player1.turn) {
            better = match.player1;
            other = match.player2;
        } else if (match.player2.username === username && match.player2.turn) {
            better = match.player2;
            other = match.player1;
        }
        if (better && other) {
            this.log.info(JSON.stringify(better));
            const raise = better.bet + amount - other.bet;
            if (better.stack <= amount) { // All-in
                better.bet += better.stack;
                better.stack = 0;
                if (other.bet > better.bet) {
                    other.stack += (other.bet - better.bet);
                    other.bet = better.bet;
                }

                if (other.bet === better.bet || other.stack === 0) {
                    return BetType.call;
                }
                return BetType.shove;
            } else if (amount === 0 && better.bet === other.bet) {
                return BetType.check;
            } else if (raise === 0 || raise > match.minRaise) {
                better.stack -= amount;
                better.bet += amount;

                if (raise === 0 && better.bet === match.bigBlind) {
                    return BetType.limp;
                } else if (raise === 0) {
                    return BetType.call;
                } else if (raise >= match.minRaise) {
                    match.minRaise = raise;
                    return BetType.raiseOrBet;
                }
            }
        }

        return undefined;
    }

    public afterBet(match: PokerMatch, type: BetType): PokerMatch {
        if (type === BetType.call || (type === BetType.check &&
            // If BB checked pre-flop or SB checked post-flop then round is over
            (match.boardState.length === 0 && this.bigBlindTurn(match)) || (match.boardState.length !== 0 && !this.bigBlindTurn(match)))) {

            if (match.boardState.length === 5) {
                return this.finishHand(match);
            }

            return this.endBettingRound(match);
        }
        [match.player1.turn, match.player2.turn] = [match.player2.turn, match.player1.turn];
        return match;
    }

    public finishHand(match: PokerMatch): PokerMatch {
        // TODO: determine the winner
        const winner = match.player1;

        winner.stack += match.player1.bet + match.player2.bet;
        match.player1.bet = 0;
        match.player2.bet = 0;
        match.handComplete = true;
        match.handsPlayed++;

        return match;
    }

    public endBettingRound(match: PokerMatch): PokerMatch {
        // Reset minRaise
        match.minRaise = match.bigBlind;

        // Set Proper Turn, BB to act first
        if (match.player1.bigBlind) {
            [match.player1.turn, match.player2.turn] = [true, false];
        } else {
            [match.player1.turn, match.player2.turn] = [false, true];
        }

        let deal = 1;
        if (match.boardState.length === 0) {
            deal = 3;
        }
        match.boardState.push(...this.deal(deal, match));
        return match;
    }

    public async nextHandRequest(io: any, username: string, room: string): Promise<void> {
        const match = await this.pokerMatchService.findActiveByRoom(room);
        if (match.handComplete) {
            if (match.player1.username === username) {
                match.player1.nextHand = true;
            } else if (match.player2.username === username) {
                match.player2.nextHand = true;
            }

            if (match.player1.nextHand && match.player2.nextHand) {
                await this.freshHand(match);
            }

            io.to(room).emit('poker match', await this.pokerMatchService.update(match));
        }
    }

    public async gameOver(match: PokerMatch): Promise<PokerMatch> {
        const p1 = match.player1;
        const p2 = match.player2;

        let newElos;
        p1.turn = false;
        p2.turn = false;
        if (p2.stack === 0) {
            p1.outcome = 'Victory';
            p2.outcome = 'Defeat';
            newElos = await this.eloService.adjust(this.GAME_NAME, p1.username, p2.username);
        } else {
            p1.outcome = 'Defeat';
            p2.outcome = 'Victory';
            newElos = await this.eloService.adjust(this.GAME_NAME, p2.username, p1.username);
        }

        p1.finalElo = newElos[p1.username];
        p2.finalElo = newElos[p2.username];

        return match;
    }

    public async requestRematch(io: any, username: string, room: string): Promise<void> {
        const match = await this.pokerMatchService.findByRoom(room);
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

        this.pokerMatchService.update(match);

        if (player.rematchRequested && opponent.rematchRequested) {
            const p1 = {
                username: match.player2.username,
                elo: match.player2.finalElo,
            } as Player;
            const p2 = {
                username: match.player1.username,
                elo: match.player1.finalElo,
            } as Player;
            let newMatch = await this.createPokerMatch(p1, p2);
            newMatch = await this.pokerMatchService.createInExistingRoom(room, newMatch);

            io.to(room).emit('poker match', newMatch);
        } else {
            io.to(room).emit('poker match', match);
        }
    }

    public async sendForcedEndWarning(io: any, room: string): Promise<void> {
        io.to(room).emit('poker matchEnding', { timeRemaining: this.WARNING_TIME });
    }

    public async forceEnd(io: any, room: string): Promise<void> {
        let match: PokerMatch = await this.pokerMatchService.findByRoom(room);

        match = await this.gameOver(match);

        io.to(room).emit('poker match', match);

        await this.pokerMatchService.update(match);
    }

    private bigBlindTurn(match: PokerMatch): boolean {
        if (match.player1.turn) {
            return match.player1.bigBlind;
        } else {
            return match.player2.bigBlind;
        }
    }

    private async freshHand(match: PokerMatch): Promise<PokerMatch> {
        match.handComplete = false;
        match.player1.nextHand = false;
        match.player2.nextHand = false;
        match.minRaise = match.bigBlind;
        if (match.player1.bigBlind === undefined) {
            [match.player1.bigBlind, match.player2.bigBlind] = [true, false];
        } else {
            [match.player1.bigBlind, match.player2.bigBlind] = [match.player2.bigBlind, match.player1.bigBlind];
        }

        match.boardState = [];
        match.cards = await this.randomService.dealCards(9);
        const bigBlind = match.player1.bigBlind ? match.player1 : match.player2;
        const smallBlind = match.player1.bigBlind ? match.player2 : match.player1;

        bigBlind.bet = match.bigBlind;
        bigBlind.stack -= match.bigBlind;
        bigBlind.hand = this.deal(2, match);
        bigBlind.turn = false;

        smallBlind.bet = match.smallBlind;
        smallBlind.stack -= match.smallBlind;
        smallBlind.hand = this.deal(2, match);
        smallBlind.turn = true;

        return match;

    }
}
