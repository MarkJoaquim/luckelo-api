import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'Elo object.',
})
export class Elo {

    @Field()
    public username: string;

    @Field()
    public game: string;

    @Field()
    public elo: number;

}
