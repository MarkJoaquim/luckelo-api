import { HttpError } from 'routing-controllers';

export class UsernameTakenError extends HttpError {
    constructor() {
        super(500, 'Username is already in use');
    }
}
