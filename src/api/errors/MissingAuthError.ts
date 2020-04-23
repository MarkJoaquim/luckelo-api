import { HttpError } from 'routing-controllers';

export class MissingAuthError extends HttpError {
    constructor() {
        super(401, 'Authorization Required');
    }
}
