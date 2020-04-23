import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'Game object.',
})
export class Game {

    @Field()
    public name: string;

}
