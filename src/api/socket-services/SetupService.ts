import { Service } from 'typedi';

@Service()
export class SetupService {
    public connections: Record<string, string> = {};

    public connect(username: string, socketId: string): string {
        const oldSocketId = this.connections[username];

        this.connections[username] = socketId;

        return oldSocketId;
    }

    public disconnect(username: string): void {
        this.connections[username] = undefined;
    }
}
