import {Middleware, MiddlewareInterface} from 'socket-controllers';
import { InvalidAuthError } from '../errors/InvalidAuthError';
import { MissingAuthError } from '../errors/MissingAuthError';
import { verify } from 'jsonwebtoken';
import { env } from '../../env';
import { AuthJwtPayload } from 'src/auth/AuthJwt';

@Middleware()
export class SocketAuthMiddleware implements MiddlewareInterface {

    public use(socket: any, next: ((err?: any) => any)): void {
        if (socket.handshake.query.token) {
            try {
                const token: AuthJwtPayload = verify(socket.handshake.query.token, env.app.jwtSecret) as AuthJwtPayload;
                if (token.name) {
                    socket.user = token.name;
                    return next();
                }
            } catch (err) {
                return next(new InvalidAuthError());
            }
        }

        return next(new MissingAuthError());
    }

}
