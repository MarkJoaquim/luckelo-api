import { User } from './User';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'UrPlayer object.',
})
export class UrPlayer {
    @Field()
    public id: number;

    @Field()
    public username: string;

    @Field()
    public initialElo: number;

    @Field()
    public turn: boolean;

    @Field()
    public piecesAtStart: number;

    @Field()
    public piecesHome: number;

    @Field()
    public roll: number;

    @Field()
    public outcome: string;

    @Field()
    public finalElo: number;

    @Field()
    public rematchRequested: boolean;

    @Field()
    public user: User;
}
