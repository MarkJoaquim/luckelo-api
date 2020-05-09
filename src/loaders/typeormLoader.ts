import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { createConnection, getConnectionOptions } from 'typeorm';

import { env } from '../env';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {

    const loadedConnectionOptions = await getConnectionOptions();

    let connectionOptions;
    if (env.db.url) {
        connectionOptions = Object.assign(loadedConnectionOptions, {
            url: env.db.url,
            type: env.db.type,
            entities: env.app.dirs.entities,
            synchronize: env.db.synchronize,
            logging: env.db.logging,
            extra: {
                ssl: true,
            },
        });
    } else {
        connectionOptions = Object.assign(loadedConnectionOptions, {
            type: env.db.type as any, // See createConnection options for valid types
            host: env.db.host,
            port: env.db.port,
            username: env.db.username,
            password: env.db.password,
            database: env.db.database,
            synchronize: env.db.synchronize,
            logging: env.db.logging,
            entities: env.app.dirs.entities,
            migrations: env.app.dirs.migrations,
        });
    }

    const connection = await createConnection(connectionOptions);

    if (settings) {
        settings.setData('connection', connection);
        settings.onShutdown(() => connection.close());
    }
};
