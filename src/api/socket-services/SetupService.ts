import { Service } from 'typedi';

@Service()
export class SetupService {
    public connections: Record<string, string> = {};

    public connect(username: string, socketId: string): string {
        return this.connections[username];
    }

    public disconnect(username: string, socketId: string): void {
        this.connections[username] = undefined;
    }
}
