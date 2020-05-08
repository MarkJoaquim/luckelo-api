import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'Match object.',
})
export class Match {

    @Field()
    public id: number;

    @Field()
    public created: Date;

    @Field()
    public gameName: string;
}
