import { Player } from './Player';

export interface MatchDetails {
    game: string;
    matchId: string;
    players: Player[];
}
