import { SocketController, OnMessage, ConnectedSocket, MessageBody, SocketIO } from 'socket-controllers';
import { BalderdashService } from '../socket-services';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Server } from 'socket.io';

@SocketController()
export class BalderdashController {

    constructor(
        public balderdashService: BalderdashService,
        @Logger(__filename) private log: LoggerInterface) {
    }

    @OnMessage('balderdash getMatch')
    public async getMatch(@SocketIO() io: Server, @ConnectedSocket() socket: any, @MessageBody() message: any): Promise<void> {
        const match = await this.balderdashService.getMatch(message.room);
        if (match !== undefined) {
            socket.to(message.room).emit('joinedRoom', { username: socket.user });
            socket.join(message.room);
        }
        this.log.info(`${JSON.stringify(match)}`);
        socket.emit('balderdash match', match);

        const spectators: string[] = [];
        Object.values(io.sockets.connected).map(skt => {
            if (skt.rooms[message.room]) {
                spectators.push((skt as any).user);
            }
        });
        socket.emit('balderdash spectators', { list: spectators });
    }

    @OnMessage('balderdash start')
    public start(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`start received from ${socket.user}`);
        this.balderdashService.start(io, message.room);
    }

    @OnMessage('balderdash join')
    public join(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`join received from ${socket.user}`);
        this.balderdashService.joinMatch(io, socket.user, message.room);
    }

    @OnMessage('balderdash leave')
    public leave(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`leave received from ${socket.user}`);
        this.balderdashService.leaveMatch(io, socket.user, message.room);
    }

    @OnMessage('balderdash definition')
    public roll(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`definition received from ${socket.user}`);
        this.balderdashService.submitDefinition(io, socket.user, message.room, message.definition);
    }

    @OnMessage('balderdash vote')
    public vote(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`vote received from ${socket.user}`);
        this.balderdashService.submitVote(io, socket.user, message.room, message.vote);
    }

    @OnMessage('balderdash requestRematch')
    public requestRematch(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        this.log.info(`rematch request received from ${socket.user}`);
        this.balderdashService.requestRematch(io, socket.user, message.room);
    }
}
