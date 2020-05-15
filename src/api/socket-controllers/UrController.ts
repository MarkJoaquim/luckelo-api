import { SocketController, OnMessage, ConnectedSocket, MessageBody, SocketIO } from 'socket-controllers';
import { UrService } from '../socket-services';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Server } from 'socket.io';

@SocketController()
export class DiceController {

    constructor(
        public urService: UrService,
        @Logger(__filename) private log: LoggerInterface) {
    }

    @OnMessage('ur getMatch')
    public async getMatch(@SocketIO() io: Server, @ConnectedSocket() socket: any, @MessageBody() message: any): Promise<void> {
        const match = await this.urService.getMatch(message.room);
        if (match !== undefined) {
            socket.to(message.room).emit('joinedRoom', { username: socket.user });
            socket.join(message.room);
        }
        this.log.info(`${JSON.stringify(match)}`);
        socket.emit('ur match', match);

        const spectators: string[] = [];
        Object.values(io.sockets.connected).map(skt => {
            if (skt.rooms[message.room]) {
                spectators.push((skt as any).user);
            }
        });
        socket.emit('ur spectators', { list: spectators });
    }

    @OnMessage('ur move')
    public roll(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`move received from ${socket.user}`);
        this.urService.move(io, socket.user, message.room, message.move);
    }

    @OnMessage('ur requestRematch')
    public requestRematch(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`rematch request received from ${socket.user}`);

        this.urService.requestRematch(io, socket.user, message.room);
    }
}
