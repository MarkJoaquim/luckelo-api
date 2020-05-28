import { SocketController, OnConnect, OnDisconnect, ConnectedSocket, SocketIO, OnMessage, MessageBody } from 'socket-controllers';
import { SetupService } from '../socket-services';
import { Server } from 'socket.io';
import { DiceMatchService } from '../services/DiceMatchService';
import { UrMatchService } from '../services/UrMatchService';
import { PokerMatchService } from '../services/PokerMatchService';
import { BalderdashMatchService } from '../services/BalderdashMatchService';

@SocketController()
export class FindMatchController {

    constructor(
        public setupService: SetupService,
        public diceMatchService: DiceMatchService,
        public urMatchService: UrMatchService,
        public pokerMatchService: PokerMatchService,
        public balderdashMatchService: BalderdashMatchService
        ) {}

    @OnConnect()
    public connection(@ConnectedSocket() socket: any, @SocketIO() io: any): void {
        const alreadyConnected: string = this.setupService.connect(socket.user, socket.id);

        if (alreadyConnected !== undefined) {
            const oldSocket = io.sockets.connected[alreadyConnected];
            Object.keys(oldSocket.rooms).forEach(room => socket.join(room));
            oldSocket.disconnect();
        }
    }

    @OnDisconnect()
    public disconnection(@ConnectedSocket() socket: any): void {
        this.setupService.disconnect(socket.user);
    }

    @OnMessage('leaveRoom')
    public leaveRoom(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: any): void {
        socket.leave(message.room);
        socket.to(message.room).emit('leftRoom', { username: socket.user });
    }

    @OnMessage('getActiveRooms')
    public async getActiveRooms(@SocketIO() io: any, @ConnectedSocket() socket: any): Promise<void> {
        const ioServer = io as Server;
        const roomsWithConnectedSockets: string[] = [];
        // For all connected sockets, add non-id rooms to the list
        Object.values(ioServer.sockets.connected).map(skt => {
            roomsWithConnectedSockets.push(...Object.values(skt.rooms).filter(room => room !== skt.id));
        });
        const matches: any[] = [
            ...await this.diceMatchService.findRoomsInList(roomsWithConnectedSockets),
            ...await this.urMatchService.findRoomsInList(roomsWithConnectedSockets),
            ...await this.pokerMatchService.findRoomsInList(roomsWithConnectedSockets),
            ...await this.balderdashMatchService.findRoomsInList(roomsWithConnectedSockets),
        ];
        socket.emit('activeRooms', matches);
    }
}
