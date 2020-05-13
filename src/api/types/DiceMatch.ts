import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'Match object.',
})
export class DiceMatch {

    @Field()
    public id: number;

    @Field()
    public created: Date;

    @Field()
    public room: string;

    @Field()
    public gameName: string;
}
