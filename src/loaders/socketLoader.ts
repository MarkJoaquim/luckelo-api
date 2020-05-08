import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { createSocketServer } from 'socket-controllers';
import { useContainer as socketControllerUseContainer } from 'socket-controllers';
import { Container } from 'typedi';

import { env } from '../env';

export const socketLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {

    socketControllerUseContainer(Container);

    createSocketServer(env.app.socketPort as number, {
        controllers: env.app.dirs.socketControllers,
        middlewares: env.app.dirs.socketMiddlewares,
    });
};
