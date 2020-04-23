import { Field, InputType } from 'type-graphql';

import { Elo } from '../Elo';

@InputType()
export class EloInput implements Partial<Elo> {

    @Field()
    public username: string;

    @Field()
    public game: string;

}
