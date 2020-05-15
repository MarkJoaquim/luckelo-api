import { Game } from './Game';
import { UrPlayer } from './UrPlayer';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'UrMatch object.',
})
export class UrMatch {
    @Field()
    public id: number;

    @Field()
    public created: Date;

    @Field()
    public room: string;

    @Field()
    public gameName: string;

    @Field()
    public game: Game;

    @Field()
    public boardState: string;

    @Field()
    public player1: UrPlayer;

    @Field()
    public player2: UrPlayer;
}
