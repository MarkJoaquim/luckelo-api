import { Service } from 'typedi';

import { MatchInquiry, MatchDetails, Player } from '../socket-controllers/interfaces';

@Service()
export class FindMatchService {
    public matchMaking: MatchInquiry[] = [];

    public findMatch(username: string, socketId: string, game: string, elo: number): MatchDetails {
        const player: Player = {username, socketId, elo};
        const inquiry: MatchInquiry = {player, game};

        const bestMatch = this.findBestMatch(inquiry);

        if (!bestMatch) {
            if (this.matchMaking.indexOf(inquiry) === -1) {
                this.matchMaking.push(inquiry);
            }
            return undefined;
        }

        let matchId: string;
        while (!matchId) {
            matchId = Math.random().toString(36).substring(2, 8);
        }

        return {
            game,
            matchId,
            players: [bestMatch.player, player],
        };
    }

    public stopSearching(username: string, game: string): void {
        this.matchMaking = this.matchMaking.filter((inquiry) => inquiry.player.username !== username && inquiry.game !== game);
    }

    private findBestMatch(inquiry: MatchInquiry): MatchInquiry {
        let bestInquiryIndex = -1;
        let bestInquiry: MatchInquiry;

        for (let i = 0; i < this.matchMaking.length; i++) {
            const candidate = this.matchMaking[i];
            if (candidate.game === inquiry.game && candidate.player.username !== inquiry.player.username) {
                bestInquiryIndex = i;
                bestInquiry = this.matchMaking[i];
            }
        }

        if (bestInquiryIndex === -1) {
            return undefined;
        }

        this.matchMaking.splice(bestInquiryIndex, 1);

        return bestInquiry;
    }
}
