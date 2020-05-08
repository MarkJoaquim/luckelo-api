import { SocketController, OnConnect, OnDisconnect, ConnectedSocket, SocketIO } from 'socket-controllers';
import { SetupService } from '../socket-services';

@SocketController()
export class FindMatchController {

    constructor(
        public setupService: SetupService
        ) {}

    @OnConnect()
    public connection(@ConnectedSocket() socket: any, @SocketIO() io: any): void {
        const alreadyConnected: string = this.setupService.connect(socket.user, socket.id);

        if (alreadyConnected !== undefined) {
            const oldSocket = io.sockets.connected[alreadyConnected];
            console.log('REMOVING STALE SOCKET');
            console.log(oldSocket.rooms);
            oldSocket.rooms.forEach(room => socket.join(room));
            oldSocket.disconnect();
        }
    }

    @OnDisconnect()
    public disconnection(@ConnectedSocket() socket: any): void {
        this.setupService.disconnect(socket.user, socket.id);
    }
}
