import { Service } from 'typedi';
import { FindMatchService } from './FindMatchService';

@Service()
export class SetupService {
    public connections: Record<string, string> = {};

    constructor (public findMatchService: FindMatchService) {}

    public connect(username: string, socketId: string): string {
        const oldSocketId = this.connections[username];

        this.connections[username] = socketId;

        return oldSocketId;
    }

    public disconnect(username: string): void {
        this.connections[username] = undefined;
        this.findMatchService.stopSearching(username);
    }
}
