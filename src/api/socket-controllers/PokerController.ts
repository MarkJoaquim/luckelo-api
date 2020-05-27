import { SocketController, OnMessage, ConnectedSocket, MessageBody, SocketIO } from 'socket-controllers';
import { PokerService } from '../socket-services';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Server } from 'socket.io';

@SocketController()
export class DiceController {

    constructor(
        public pokerService: PokerService,
        @Logger(__filename) private log: LoggerInterface) {
    }

    @OnMessage('poker getMatch')
    public async getMatch(@SocketIO() io: Server, @ConnectedSocket() socket: any, @MessageBody() message: any): Promise<void> {
        const match = await this.pokerService.getMatch(message.room);
        if (match !== undefined) {
            socket.to(message.room).emit('joinedRoom', { username: socket.user });
            socket.join(message.room);
        }
        this.log.info(`${JSON.stringify(match)}`);
        this.pokerService.safeSend(socket, match);

        const spectators: string[] = [];
        Object.values(io.sockets.connected).map(skt => {
            if (skt.rooms[message.room]) {
                spectators.push((skt as any).user);
            }
        });
        socket.emit('poker spectators', { list: spectators });
    }

    @OnMessage('poker bet')
    public bet(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`Bet received from ${socket.user} in room ${message.room} for ${message.amount}`);
        this.pokerService.bet(io, socket.user, message.room, message.amount);
    }

    @OnMessage('poker show')
    public show(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`Show card from ${socket.user} in room ${message.room} card: ${message.card}`);
        this.pokerService.showCard(io, socket.user, message.room, message.card);
    }

    @OnMessage('poker requestRematch')
    public requestRematch(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`rematch request received from ${socket.user}`);

        this.pokerService.requestRematch(io, socket.user, message.room);
    }
}
