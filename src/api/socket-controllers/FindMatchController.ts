import { SocketController, ConnectedSocket, OnMessage, MessageBody, SocketIO } from 'socket-controllers';
import { FindMatchService, DiceService, UrService, PokerService } from '../socket-services';
import { MatchSearch, MatchDetails } from './interfaces';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { EloService } from '../services/EloService';

@SocketController()
export class FindMatchController {

    constructor(
        public findMatchService: FindMatchService,
        public diceService: DiceService,
        public urService: UrService,
        public pokerService: PokerService,
        public eloService: EloService,
        @Logger(__filename) private log: LoggerInterface
        ) {}

    @OnMessage('findMatch')
    public async findMatch(@ConnectedSocket() socket: any, @SocketIO() io: any, @MessageBody() message: MatchSearch): Promise<void> {
        this.log.info(`Find Match from ${socket.user}`);
        const elo = await this.eloService.findOne(socket.user, message.game);

        const match = this.findMatchService.findMatch(socket.user, socket.id, message.game, elo.elo);
        this.log.info(`Match: ${JSON.stringify(match)}`);
        if (!match) {
            return;
        }

        const room = await this.createMatch(match);

        match.players.forEach(user => {
            io.sockets.connected[user.socketId].emit('matchFound', { room });
        });
    }

    @OnMessage('stopSearching')
    public async stopSearching(@ConnectedSocket() socket: any, @MessageBody() message: MatchSearch): Promise<void> {
        this.log.info(`stopped searching for match for ${socket.user}`);
        this.findMatchService.stopSearching(socket.user, message.game);
    }

    private async createMatch(match: MatchDetails): Promise<string> {
        if (match.game.toLowerCase() === 'dice') {
            return await this.diceService.createGame(match);
        } else if (match.game.toLowerCase() === 'ur') {
            return await this.urService.createGame(match);
        } else if (match.game.toLowerCase() === 'poker') {
            return await this.pokerService.createGame(match);
        }

        return undefined;
    }
}
