import { Service } from 'typedi';
import { MatchDetails } from '../socket-controllers/interfaces';
import { RandomService } from '../services/RandomService';
import { EloService } from '../services/EloService';
import { BalderdashMatchService } from '../services/BalderdashMatchService';
import { BalderdashMatch } from '../models/BalderdashMatch';
import { Logger, LoggerInterface } from '../../../src/decorators/Logger';
import { BalderdashPlayer } from '../models/BalderdashPlayer';
import { BalderdashState } from '../models/BalderdashState';

@Service()
export class BalderdashService {
    public rolls: number[] = [];
    public timeouts: Record<string, NodeJS.Timeout[]> = {};
    // private TURN_TIME_LIMIT = 30000;
    private WARNING_TIME = 5000;
    private gameName = 'Balderdash';

    constructor(
        public randomService: RandomService,
        public eloService: EloService,
        public balderdashMatchService: BalderdashMatchService,
        @Logger(__filename) private log: LoggerInterface) {}

    public async createGame(matchDetails: MatchDetails): Promise<string> {
        const match = new BalderdashMatch();
        match.players = matchDetails.players.map(player => {
            const balderdashPlayer = new BalderdashPlayer();
            balderdashPlayer.username = player.username;
            balderdashPlayer.initialElo = player.elo;
            return balderdashPlayer;
        });

        return await this.balderdashMatchService.createInNewRoom(match);
    }

    public async getMatch(room: string): Promise<BalderdashMatch> {
        return await this.balderdashMatchService.findByRoom(room);
    }

    public async joinMatch(io: any, username: string, room: string): Promise<BalderdashMatch> {
        const match: BalderdashMatch = await this.balderdashMatchService.findByRoom(room);

        if (!match.players.find(p => p.username === username)) {
            const elo = await this.eloService.findOne(username, 'Balderdash');

            const newPlayer = new BalderdashPlayer();
            newPlayer.matchId = match.id;
            newPlayer.username = username;
            newPlayer.initialElo = elo.elo;

            match.players.push(newPlayer);
            await this.balderdashMatchService.update(match);

            io.to(room).emit('balderdash match', await this.balderdashMatchService.findByRoom(room));
        }

        return match;
    }

    public async leaveMatch(io: any, username: string, room: string): Promise<void> {
        const match: BalderdashMatch = await this.balderdashMatchService.findByRoom(room);
        const player = match.players.find(p => p.username === username);
        if (player) {
            this.balderdashMatchService.leaveMatch(player);

            io.to(room).emit('balderdash match', await this.balderdashMatchService.findByRoom(room));
        }
    }

    public async start(io: any, room: string): Promise<void> {
        this.log.info('start');
        io.to(room).emit('balderdash match', await this.balderdashMatchService.setWord(room));
    }

    public async submitDefinition(io: any, username: string, room: string, definition: string): Promise<void> {
        const match: BalderdashMatch = await this.balderdashMatchService.findActiveByRoom(room);

        let defnSubmitted = false;
        match.players.map(player => {
            if (player.username === username) {
                player.definition = definition;
                defnSubmitted = true;
            }
        });

        if (defnSubmitted) {
            if (match.players.findIndex(player => !player.definition) === -1) {
                match.state = BalderdashState.vote;
            }

            io.to(room).emit('balderdash match', await this.balderdashMatchService.update(match));
        }
    }

    public async submitVote(io: any, username: string, room: string, votingFor: number): Promise<void> {
        const match: BalderdashMatch = await this.balderdashMatchService.findActiveByRoom(room);

        let voteCast = false;
        match.players.map(player => {
            if (player.username === username) {
                player.voted = true;
                if (votingFor > 0) {
                    player.votedFor = votingFor;
                } else {
                    player.votedFor = undefined;
                }
                voteCast = true;
            }
        });

        if (voteCast) {
            if (match.players.findIndex(player => !player.voted) === -1) {
                match.state = BalderdashState.complete;
                this.gameOver(match);
            }

            io.to(room).emit('balderdash match', await this.balderdashMatchService.update(match));
        }
    }

    public async gameOver(match: BalderdashMatch): Promise<BalderdashMatch> {
        await Promise.all(match.players.map(async player => {
            const avgElo = match.players
                .filter(p => p.username !== player.username)
                .map(p => p.initialElo)
                .reduce((acc, cur) => acc + cur, 0) / match.players.length;

            const expected = Math.pow(1 + Math.pow(10, (avgElo - player.initialElo) / 400), -1);
            let outcome = match.players.map<number>(p => p.votedFor === player.id ? 1 : 0).reduce((acc, cur) => acc + cur, 0);
            if (!player.votedFor && player.voted) {
                outcome++;
            }

            player.finalElo = await this.eloService.modifyElo(this.gameName, player.username, expected, outcome);
        }));

        return match;
    }

    public async requestRematch(io: any, username: string, room: string): Promise<void> {
        const match = await this.balderdashMatchService.findByRoom(room);

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

        this.balderdashMatchService.update(match);

        if (match.players.find(player => !player.rematchRequested) === undefined) {
            let newMatch = new BalderdashMatch();
            newMatch.players = await Promise.all(match.players.map(async player => {
                if (!player.finalElo) {
                    player.finalElo = (await this.eloService.findOne(player.username, 'Balderdash')).elo;
                }
                const balderdashPlayer = new BalderdashPlayer();
                balderdashPlayer.username = player.username;
                balderdashPlayer.initialElo = player.finalElo;
                return balderdashPlayer;
            }));
            newMatch = await this.balderdashMatchService.createInExistingRoom(room, newMatch);

            io.to(room).emit('balderdash match', newMatch);
        } else {
            io.to(room).emit('balderdash match', match);
        }
    }

    public async sendForcedEndWarning(io: any, room: string): Promise<void> {
        io.to(room).emit('balderdash matchEnding', { timeRemaining: this.WARNING_TIME });
    }

    public async forceEnd(io: any, room: string): Promise<void> {
        let match: BalderdashMatch = await this.balderdashMatchService.findByRoom(room);

        match = await this.gameOver(match);

        io.to(room).emit('balderdash match', match);

        await this.balderdashMatchService.update(match);
    }
}
