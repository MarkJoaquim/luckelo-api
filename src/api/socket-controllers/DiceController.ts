import { SocketController, OnMessage, ConnectedSocket, MessageBody, SocketIO } from 'socket-controllers';
import { DiceService } from '../socket-services';
import { Logger, LoggerInterface } from '../../decorators/Logger';

@SocketController()
export class DiceController {

    constructor(
        public diceService: DiceService,
        @Logger(__filename) private log: LoggerInterface) {
    }

    @OnMessage('dice getMatch')
    public async getMatch(@ConnectedSocket() socket: any, @MessageBody() message: any): Promise<void> {
        this.log.info(`received request for match from ${socket.user} ${message.room}`);

        const match = await this.diceService.getMatch(message.room);
        if (match !== undefined) {
            socket.join(message.room);
        }
        this.log.info(`${JSON.stringify(match)}`);
        socket.emit('dice match', match);
    }

    @OnMessage('dice roll')
    public roll(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`roll received from ${socket.user}`);

        this.diceService.roll(io, socket.user, message.room);
    }

    @OnMessage('dice requestRematch')
    public requestRematch(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`rematch request received from ${socket.user}`);

        this.diceService.requestRematch(io, socket.user, message.room);
    }
}
