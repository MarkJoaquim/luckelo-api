import { IsNotEmpty } from 'class-validator';
import { JsonController, Authorized, Get, Param } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { GameService } from '../services/GameService';
import { Game } from '../models/Game';
import { User } from '../models/User';

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
        private gameService: GameService
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
}
