import { JsonController, Authorized, Get, Param, Post, Req, Body } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CharmService } from '../services/CharmService';
import { User } from '../models/User';

@Authorized()
@JsonController('/charm')
@OpenAPI({})
export class GameController {

    constructor(
        private charmService: CharmService
    ) { }

    @Get('/:username')
    @ResponseSchema(User)
    public async charmForUser(@Param('username') username: string): Promise<User> {
        return await this.charmService.findUserWithCharm(username);
    }

    @Post('/add/:property')
    @ResponseSchema(User)
    public async upgradeCharm(@Req() req: any, @Param('property') property: 'color' | 'pixel'): Promise<User> {
        switch (property) {
            case 'color':
                return await this.charmService.addColor(req.username);
            case 'pixel':
                return await this.charmService.addPixel(req.username);
            default:
                return undefined;
        }
    }

    @Post('/reroll/:paletteIndex')
    @ResponseSchema(User)
    public async reroll(@Req() req: any, @Param('paletteIndex') paletteIndex: number): Promise<User> {
        return await this.charmService.reroll(req.username, paletteIndex);
    }

    @Post('/save')
    @ResponseSchema(User)
    public async save(@Req() req: any, @Body() charm: number[]): Promise<User> {
        return await this.charmService.save(req.username, charm);
    }

}
