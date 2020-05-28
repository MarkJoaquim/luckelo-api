import { ObjectType, Field } from 'type-graphql';

@ObjectType({
    description: 'BalderdashPlayer object.',
})
export class BalderdashPlayer {
    @Field()
    public matchId: number;

    @Field()
    public username: string;

    @Field()
    public initialElo: number;

    @Field()
    public definition: string;

    @Field()
    public voted: boolean;

    @Field()
    public votedFor: number;

    @Field()
    public outcome: string;

    @Field()
    public finalElo: number;

    @Field()
    public rematchRequested: boolean;
}
