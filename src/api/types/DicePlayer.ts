import { ObjectType, Field } from 'type-graphql';

@ObjectType({
    description: 'DicePlayer object.',
})
export class DicePlayer {
    @Field()
    public matchId: number;

    @Field()
    public username: string;

    @Field()
    public initialElo: number;

    @Field()
    public roll: number;

    @Field()
    public outcome: string;

    @Field()
    public finalElo: number;

    @Field()
    public rematchRequested: boolean;
}
