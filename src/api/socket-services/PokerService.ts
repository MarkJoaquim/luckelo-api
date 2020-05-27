import { Service } from 'typedi';
import { MatchDetails, Player } from '../socket-controllers/interfaces';
import { RandomService } from '../services/RandomService';
import { EloService } from '../services/EloService';
import { PokerMatchService } from '../services/PokerMatchService';
import { PokerMatch } from '../models/PokerMatch';
import { Logger, LoggerInterface } from '../../../src/decorators/Logger';
import { PokerPlayer } from '../models/PokerPlayer';
import { Server } from 'socket.io';

enum BetType {limp, raiseOrBet, check, call, shove, fold}
enum Hand {highCard, pair, twoPair, three, straight, flush, fullHouse, four, straightFlush, royalFlush}

@Service()
export class PokerService {
    public rolls: number[] = [];
    public timeouts: Record<string, Record<string, NodeJS.Timeout>> = {};
    private WARNING_TIME = 5000;
    private GAME_NAME = 'Poker';
    private INITIAL_SMALL_BLIND = 1;
    private INITIAL_BIG_BLIND = 2;
    private INITIAL_STACK = 100;
    private DEAL_TIMEOUT_NAME = 'deal';
    private DEAL_TIMEOUT = 5000;

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
        match.pot = 0;

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

    public safeSend(socket: any, match: PokerMatch): void {

        const hiddenMatch: PokerMatch = { ...match };
        delete hiddenMatch.cards;
        const hiddenP1 = { ...match.player1 };
        hiddenP1.hand = hiddenP1.hand.map(card => -1);
        const hiddenP2 = { ...match.player2 };
        hiddenP2.hand = hiddenP2.hand.map(card => -1);

        if (socket.user === match.player1.username) {
            hiddenMatch.player2 = hiddenP2;
        } else if (socket.user === match.player2.username) {
            hiddenMatch.player1 = hiddenP1;
        }

        socket.emit('poker match', hiddenMatch);
    }

    public broadcastMatch(io: Server, match: PokerMatch): void {
        Object.values(io.sockets.connected).map(skt => {
            if (skt.rooms[match.room]) {
                this.safeSend(skt, match);
            }
        });
    }

    public async showCard(io: any, username: string, room: string, card: number): Promise<void> {
        const match = await this.pokerMatchService.findByRoom(room);
        let value: number;
        if (match.player1.username === username) {
            value = match.player1.hand[card];
        } else if (match.player2.username === username) {
            value = match.player2.hand[card];
        }

        if (value !== undefined) {
            io.to(room).emit('poker card', { username, card, value });
        }
    }

    public async bet(io: any, username: string, room: string, amount: number): Promise<void> {
        const match = await this.pokerMatchService.findActiveByRoom(room);

        const type = this.handleBet(match, username, amount);
        if (type !== undefined) {
            this.afterBet(io, match, type);

            if (match.handComplete && (match.player1.stack === 0 || match.player2.stack === 0)) {
                await this.gameOver(match);
            }

            this.broadcastMatch(io, await this.pokerMatchService.update(match));
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
            if (amount === -1) {
                return BetType.fold;
            }
            const raise = better.bet + amount - other.bet;
            if (better.stack <= amount) { // All-in
                better.bet += better.stack;
                better.stack = 0;
                if (other.bet > better.bet) {
                    other.stack += (other.bet - better.bet);
                    other.bet = better.bet;
                    return BetType.call;
                }

                if (other.bet < better.bet && other.stack === 0) {
                    better.stack += (better.bet - other.bet);
                    better.bet = other.bet;
                    return BetType.call;
                }

                if (other.bet === better.bet || other.stack === 0) {
                    return BetType.call;
                }
                return BetType.shove;
            } else if (amount === 0 && better.bet === other.bet) {
                return BetType.check;
            } else if (raise === 0 || raise >= match.minRaise) {
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

    public afterBet(io: any, match: PokerMatch, type: BetType): PokerMatch {
        if (type === BetType.call || (type === BetType.check &&
            // If BB checked pre-flop or SB checked post-flop then round is over
            ((match.boardState.length === 0 && this.bigBlindTurn(match)) || (match.boardState.length !== 0 && !this.bigBlindTurn(match))))) {

            if (match.boardState.length === 5) {
                return this.finishHand(io, match);
            }

            if (match.player1.stack === 0 || match.player2.stack === 0) {
                return this.allInFinishHand(io, match);
            }

            return this.endBettingRound(match);
        }
        if (type === BetType.fold) {
            return this.finishHand(io, match, true);
        }
        [match.player1.turn, match.player2.turn] = [match.player2.turn, match.player1.turn];
        return match;
    }

    public finishHand(io: any, match: PokerMatch, fold: boolean = false): PokerMatch {
        let winner: PokerPlayer;
        let loser: PokerPlayer;
        if (fold) {
            winner = match.player1.turn ? match.player2 : match.player1;
        } else {
            const p1Hand = this.getHand(match.player1.hand, match.boardState);
            const p2Hand = this.getHand(match.player2.hand, match.boardState);
            const result = this.compareHands(p1Hand, p2Hand);

            if (result > 0) {
                winner = match.player1;
                loser = match.player2;
            } else if (result < 0)  {
                winner = match.player2;
                loser = match.player1;
            }
            if (winner) {
                if (!winner.bigBlind) {
                    this.showCard(io, loser.username, match.room, 0);
                    this.showCard(io, loser.username, match.room, 1);
                }

                this.showCard(io, winner.username, match.room, 0);
                this.showCard(io, winner.username, match.room, 1);
            }
        }

        if (winner) {
            winner.stack += match.pot + match.player1.bet + match.player2.bet;
        } else {
            match.player1.stack += Math.floor((match.pot + match.player1.bet + match.player2.bet) / 2);
            match.player2.stack += Math.floor((match.pot + match.player1.bet + match.player2.bet) / 2);

            this.showCard(io, match.player1.username, match.room, 0);
            this.showCard(io, match.player1.username, match.room, 1);
            this.showCard(io, match.player2.username, match.room, 0);
            this.showCard(io, match.player2.username, match.room, 1);
        }
        match.pot = 0;
        match.player1.bet = 0;
        match.player2.bet = 0;
        match.handComplete = true;

        this.addTimeout(match.room, this.DEAL_TIMEOUT_NAME, async () => {
            match.handsPlayed++;
            await this.freshHand(match);
            this.broadcastMatch(io, await this.pokerMatchService.update(match));
        }, this.DEAL_TIMEOUT);

        return match;
    }

    public allInFinishHand(io: any, match: PokerMatch): PokerMatch {
        let time = 1000;
        match.player1.turn = false;
        match.player2.turn = false;

        if (match.boardState.length === 0) {
            this.addTimeout(match.room, 'allInFlop', async () => {
                match.boardState.push(...this.deal(3, match));
                io.to(match.room).emit('poker match', await this.pokerMatchService.update(match));
            }, time);
            time += 2000;
        }
        if (match.boardState.length < 4) {
            this.addTimeout(match.room, 'allInTurn', async () => {
                const m = await this.pokerMatchService.findActiveByRoom(match.room);
                m.boardState.push(...this.deal(1, m));
                io.to(m.room).emit('poker match', await this.pokerMatchService.update(m));
            }, time);
            time += 2000;
        }
        if (match.boardState.length < 5) {
            this.addTimeout(match.room, 'allInRiver', async () => {
                const m = await this.pokerMatchService.findActiveByRoom(match.room);
                m.boardState.push(...this.deal(1, m));
                io.to(m.room).emit('poker match', await this.pokerMatchService.update(m));
            }, time);
            time += 2000;
        }

        this.addTimeout(match.room, 'allInRiver', async () => {
            const m = await this.pokerMatchService.findActiveByRoom(match.room);
            this.finishHand(io, m);
            if (m.handComplete && (m.player1.stack === 0 || m.player2.stack === 0)) {
                await this.gameOver(m);
            }
            io.to(m.room).emit('poker match', await this.pokerMatchService.update(m));
        }, time);

        return match;
    }

    public endBettingRound(match: PokerMatch): PokerMatch {
        // Reset minRaise
        match.minRaise = match.bigBlind;

        match.pot += match.player1.bet + match.player2.bet;
        match.player1.bet = 0;
        match.player2.bet = 0;

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

    public async gameOver(match: PokerMatch): Promise<PokerMatch> {
        this.cancelTimeout(match.room);

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

        await this.pokerMatchService.update(match);

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

            this.broadcastMatch(io, newMatch);
        } else {
            this.broadcastMatch(io, match);
        }
    }

    public async sendForcedEndWarning(io: any, room: string): Promise<void> {
        io.to(room).emit('poker turnEnding', { timeRemaining: this.WARNING_TIME });
    }

    public async forceEnd(io: any, room: string): Promise<void> {
        let match: PokerMatch = await this.pokerMatchService.findByRoom(room);

        match = await this.gameOver(match);

        this.broadcastMatch(io, match);

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

    private addTimeout(room: string, name: string, func: (...args: any[]) => void, time: number): void {
        if (this.timeouts[room] === undefined) {
            this.timeouts[room] = {};
        }

        this.timeouts[room][name] = setTimeout(func, time);
    }

    private cancelTimeout(room: string, name?: string): void {
        if (this.timeouts[room] !== undefined) {
            if (name && this.timeouts[room][name] !== undefined) {
                clearTimeout(this.timeouts[room][name]);
            }

            if (!name) {
                Object.values(this.timeouts[room]).map(timeout => clearTimeout(timeout));
            }
        }
    }

    private getHand(hand: number[], board: number[]): any {
        const numbers = new Array(14).fill(0);
        const suits = [[], [], [], []];
        let cards = [...hand, ...board];

        cards = cards.map(card => {
            suits[Math.floor(card / 13)].push(card % 13);
            numbers[card % 13 === 0 ? 13 : card % 13]++;
            return card % 13;
        });

        const flushCards = suits.find(val => val.length === 5);

        const fourVal = numbers.lastIndexOf(4) % 13;
        const threeVal = numbers.lastIndexOf(3) % 13;
        const pairVal = numbers.lastIndexOf(2) % 13;

        if (flushCards) {
            // It's a flush of some kind
            const bottomOfStraightFlush = this.isStraigt(flushCards);
            if (bottomOfStraightFlush === 9) {
                return { hand: Hand.royalFlush, val: [bottomOfStraightFlush] };
            }
            if (bottomOfStraightFlush !== undefined) {
                return { hand: Hand.straightFlush, val: [bottomOfStraightFlush] };
            }

            return { hand: Hand.flush, val: flushCards.sort(this.cardsDescending) };
        } else if (fourVal >= 0) {
            cards = cards.filter(card => card !== fourVal);
            return { hand: Hand.four, val: [fourVal, cards.sort(this.cardsDescending)[0]] };
        } else if (threeVal >= 0 && pairVal >= 0) {
            return { hand: Hand.fullHouse, val: [threeVal, pairVal] };
        }

        const bottomOfStraight = this.isStraigt(cards);
        if (bottomOfStraight !== undefined) {
            return { hand: Hand.straight, val: [bottomOfStraight] };
        }
        if (threeVal >= 0) {
            cards = cards.filter(card => card !== threeVal);
            return { hand: Hand.three, val: [threeVal, ...cards.sort(this.cardsDescending).slice(0, 2)] };
        }
        if (pairVal >= 0) {
            const secondPair = numbers.findIndex(val => val === 2) % 13;
            cards = cards.filter(card => card !== pairVal && card !== secondPair);
            if (secondPair !== pairVal) {
                return { hand: Hand.twoPair, val: [pairVal, secondPair, cards.sort(this.cardsDescending)[0]]};
            }
            return { hand: Hand.pair, val: [pairVal, ...cards.sort(this.cardsDescending).slice(0, 3)] };
        }

        return { hand: Hand.highCard, val: cards.sort(this.cardsDescending).slice(0, 5) };
    }

    private isStraigt(cards: number[]): number {
        const sorted = new Set(cards.map(val => val % 13));
        let consecutive = 0;
        for (let i = 13; i >= 0; i--) {
            if (sorted.has(i % 13)) {
                consecutive ++;
            } else {
                consecutive = 0;
            }

            if (consecutive === 5) {
                return i;
            }
        }
        return undefined;
    }

    private compareHands(h1: any, h2: any): number {
        if (h1.hand > h2.hand) {
            return 1;
        } else if (h2.hand > h1.hand) {
            return -1;
        }

        for (let i = 0; i < h1.val.length; i++) {
            const h1i = h1.val[i] === 0 ? 13 : h1.val[i];
            const h2i = h2.val[i] === 0 ? 13 : h2.val[i];
            if (h1i > h2i) {
                return 1;
            } else if (h2i > h1i) {
                return -1;
            }
        }

        return 0;
    }

    private cardsDescending(a: number, b: number): number {
        a = a === 0 ? 13 : a;
        b = b === 0 ? 13 : b;
        return b - a;
    }
}
