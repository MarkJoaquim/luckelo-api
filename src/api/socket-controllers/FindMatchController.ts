import { SocketController, ConnectedSocket, OnMessage, MessageBody, SocketIO } from 'socket-controllers';
import { FindMatchService, DiceService } from '../socket-services';
import { MatchSearch, MatchDetails } from './interfaces';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { EloService } from '../services/EloService';

@SocketController()
export class FindMatchController {

    constructor(
        public findMatchService: FindMatchService,
        public diceService: DiceService,
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
            socket.emit('noMatches');
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
        }

        return undefined;
    }
}
