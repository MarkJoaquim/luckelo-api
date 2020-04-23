import { IsNotEmpty } from 'class-validator';
import { Body, JsonController, Post, OnUndefined } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { sign } from 'jsonwebtoken';
import { AuthJwtPayload } from '../../auth/AuthJwt';
import { env } from '../../env';
import { Logger, LoggerInterface } from '../../decorators/Logger';

import { User } from '../models/User';
import { UserService } from '../services/UserService';

class BaseUser {
    @IsNotEmpty()
    public username: string;
}

class LoginBody extends BaseUser {
    @IsNotEmpty()
    public password: string;
}

class UserResponse extends BaseUser {
    @IsNotEmpty()
    public token: string;
}

@JsonController('/auth')
@OpenAPI({})
export class UserController {

    constructor(
        private userService: UserService,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    @Post()
    @ResponseSchema(UserResponse)
    @OnUndefined(404)
    public async login(@Body({ required: true }) body: LoginBody): Promise<UserResponse> {
        if (await this.userService.validate(body.username, body.password)) {
            return this.createUserResponse(body.username);
        }
        this.log.info('failed to validate user');

        return undefined;
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
        userResponse.username = username;

        const payload: AuthJwtPayload = {
            name: username,
            exp: 9999999999999,
        };
        userResponse.token = sign(payload, env.app.jwtSecret);

        return userResponse;
    }
}
