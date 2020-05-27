import { IsNotEmpty } from 'class-validator';
import { JsonController, Authorized, Get, Param } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { GameService } from '../services/GameService';
import { EloService } from '../services/EloService';
import { DiceMatchService } from '../services/DiceMatchService';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { Elo } from '../models/Elo';
import { DiceMatch } from '../models/DiceMatch';
import { UrMatchService } from '../services/UrMatchService';
import { UrMatch } from '../models/UrMatch';
import { PokerMatchService } from '../services/PokerMatchService';
import { PokerMatch } from '../models/PokerMatch';

class BaseGame {
    @IsNotEmpty()
    public name: string;
}

class UserGame extends BaseGame {
    public elo: number;
}

@Authorized()
@JsonController('/game')
@OpenAPI({})
export class GameController {

    constructor(
        private gameService: GameService,
        private eloService: EloService,
        private diceMatchService: DiceMatchService,
        private urMatchService: UrMatchService,
        private pokerMatchService: PokerMatchService
    ) { }

    // Make this faster by starting with Elos...
    @Get('/:username')
    @ResponseSchema(UserGame, { isArray: true })
    public async gamesForUser(@Param('username') username: string): Promise<UserGame[]> {
        const games: Game[] = await this.gameService.find();
        const user = new User();
        user.username = username;

        const userGames: UserGame[] = [];
        for (const game of games) {
            const userGame = new UserGame();
            const userElo = game.elos.find(elo => elo.username === username);

            userGame.name = game.name;
            userGame.elo = userElo ? userElo.elo : undefined;

            userGames.push(userGame);
        }

        return userGames;
    }

    @Get('/:game/leaderboard')
    @ResponseSchema(Elo, { isArray: true})
    public async leaderboardForGame(@Param('game') game: string): Promise<Elo[]> {
        return await this.eloService.findByGame(game);
    }

    @Get('/dice/match-history/:user')
    @ResponseSchema(DiceMatch, { isArray: true})
    public async diceMatchHistory(@Param('user') username: string): Promise<DiceMatch[]> {
        return await this.diceMatchService.matchHistory(username);
    }

    @Get('/ur/match-history/:user')
    @ResponseSchema(DiceMatch, { isArray: true})
    public async urMatchHistory(@Param('user') username: string): Promise<UrMatch[]> {
        return await this.urMatchService.matchHistory(username);
    }

    @Get('/poker/match-history/:user')
    @ResponseSchema(DiceMatch, { isArray: true})
    public async pokerMatchHistory(@Param('user') username: string): Promise<PokerMatch[]> {
        return await this.pokerMatchService.matchHistory(username);
    }

    @Get('/dice/match-history/:user/:opponent')
    @ResponseSchema(DiceMatch, { isArray: true})
    public async diceMatchHistoryWithOpponent(
        @Param('user') user: string,
        @Param('opponent') opponent: string): Promise<DiceMatch[]> {
        return await this.diceMatchService.matchHistoryBetween(user, opponent);
    }

    @Get('/dice/active')
    @ResponseSchema(DiceMatch, { isArray: true})
    public async diceActiveMatches(): Promise<DiceMatch[]> {
        return await this.diceMatchService.findActive();
    }
}
