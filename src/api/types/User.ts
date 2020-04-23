import { Field, ObjectType } from 'type-graphql';

import { Elo } from './Elo';

@ObjectType({
    description: 'User object.',
})
export class User {

    @Field()
    public username: string;

    @Field(type => [Elo], {
        description: 'A list of elos which belong to the user.',
    })
    public elos: Elo[];

}
