import { HttpError } from 'routing-controllers';

export class InvalidAuthError extends HttpError {
    constructor() {
        super(400, 'Invalid Credentials');
    }
}
