import { Query, Resolver, FieldResolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { User as UserModel } from '../models/User';
import { EloService } from '../services/EloService';
import { UserService } from '../services/UserService';
import { User } from '../types/User';

@Service()
@Resolver(of => User)
export class UserResolver {

    constructor(
        private userService: UserService,
        private eloService: EloService
        ) {}

    @Query(returns => [User])
    public users(): Promise<any> {
      return this.userService.find();
    }

    @FieldResolver()
    public async elos(@Root() user: UserModel): Promise<any> {
        return this.eloService.findByUser(user);
    }

}
