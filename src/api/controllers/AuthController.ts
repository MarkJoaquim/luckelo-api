import { IsNotEmpty } from 'class-validator';
import { Body, JsonController, Post, OnUndefined } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { sign } from 'jsonwebtoken';
import { AuthJwtPayload } from '../../auth/AuthJwt';
import { env } from '../../env';
import { Logger, LoggerInterface } from '../../decorators/Logger';

import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { InvalidAuthError } from '../errors/InvalidAuthError';

class LoginBody {
    @IsNotEmpty()
    public username: string;

    @IsNotEmpty()
    public password: string;
}

class UserResponse {
    @IsNotEmpty()
    public token: AuthJwtPayload;

    @IsNotEmpty()
    public signed: string;
}

@JsonController('/auth')
@OpenAPI({})
export class UserController {

    constructor(
        private userService: UserService,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    @Post('/login')
    @ResponseSchema(UserResponse)
    @OnUndefined(404)
    public async loginOrCreate(@Body({ required: true }) body: LoginBody): Promise<UserResponse> {
        this.log.info('Body', body);

        if (await this.userService.validate(body.username, body.password)) {
            return this.createUserResponse(body.username);
        }

        try {
            const user = new User();
            user.password = body.password;
            user.username = body.username;
            await this.userService.create(user);

            return this.createUserResponse(body.username);
        } catch (err) {
            this.log.info('Bad password, existing username');
            throw new InvalidAuthError();
        }
    }

    @Post('/create')
    @ResponseSchema(UserResponse)
    public async create(@Body() body: LoginBody): Promise<UserResponse> {
        const user = new User();
        user.password = body.password;
        user.username = body.username;
        await this.userService.create(user);

        return this.createUserResponse(body.username);
    }

    private createUserResponse(username: string): UserResponse {
        const userResponse = new UserResponse();

        const payload: AuthJwtPayload = {
            name: username,
            exp: 9999999999999,
        };
        userResponse.token = payload;
        userResponse.signed = sign(payload, env.app.jwtSecret);

        return userResponse;
    }
}
