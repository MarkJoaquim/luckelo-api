import { PokerPlayer } from './PokerPlayer';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'UrMatch object.',
})
export class PokerMatch {
    @Field()
    public id: number;

    @Field()
    public created: Date;

    @Field()
    public room: string;

    @Field()
    public boardState: string;

    @Field()
    public player1: PokerPlayer;

    @Field()
    public player2: PokerPlayer;
}
