import { Action } from 'routing-controllers';
import { Connection } from 'typeorm';
import { verify } from 'jsonwebtoken';
import { env } from '../env';

import { AuthJwtPayload } from 'src/auth/AuthJwt';

export function authorizationChecker(connection: Connection): (action: Action, roles: any[]) => Promise<boolean> | boolean {

    return async function innerAuthorizationChecker(action: Action, roles: string[]): Promise<boolean> {

        try {
            const authorization: string = action.request.header('Authorization');
            if (authorization && authorization.startsWith('Bearer ')) {
                const token: string = authorization.split('Bearer ')[1];
                const jwtPayload = verify(token, env.app.jwtSecret) as AuthJwtPayload;
                if (jwtPayload) {
                    action.request.username = jwtPayload.name;
                    return true;
                }
            }
        } catch (err) {
            return false;
        }

        return false;
    };
}
