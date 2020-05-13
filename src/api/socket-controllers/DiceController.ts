import { SocketController, OnMessage, ConnectedSocket, MessageBody, SocketIO } from 'socket-controllers';
import { DiceService } from '../socket-services';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Server } from 'socket.io';

@SocketController()
export class DiceController {

    constructor(
        public diceService: DiceService,
        @Logger(__filename) private log: LoggerInterface) {
    }

    @OnMessage('dice getMatch')
    public async getMatch(@SocketIO() io: Server, @ConnectedSocket() socket: any, @MessageBody() message: any): Promise<void> {
        const match = await this.diceService.getMatch(message.room);
        if (match !== undefined) {
            socket.to(message.room).emit('joinedRoom', { username: socket.user });
            socket.join(message.room);
        }
        this.log.info(`${JSON.stringify(match)}`);
        socket.emit('dice match', match);

        const spectators: string[] = [];
        Object.values(io.sockets.connected).map(skt => {
            if (skt.rooms[message.room]) {
                spectators.push((skt as any).user);
            }
        });
        socket.emit('dice spectators', { list: spectators });
    }

    @OnMessage('dice roll')
    public roll(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`roll received from ${socket.user}`);
        console.log(socket.rooms);
        this.diceService.roll(io, socket.user, message.room);
    }

    @OnMessage('dice requestRematch')
    public requestRematch(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`rematch request received from ${socket.user}`);

        this.diceService.requestRematch(io, socket.user, message.room);
    }
}
