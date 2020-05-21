import { User } from './User';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'UrPlayer object.',
})
export class PokerPlayer {
    @Field()
    public id: number;

    @Field()
    public username: string;

    @Field()
    public initialElo: number;

    @Field()
    public turn: boolean;

    @Field()
    public hand: string;

    @Field()
    public stack: number;

    @Field()
    public bigBlind: boolean;

    @Field()
    public bet: number;

    @Field()
    public finalElo: number;

    @Field()
    public rematchRequested: boolean;

    @Field()
    public user: User;
}
