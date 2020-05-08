import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'Room object.',
})
export class Room {

    @Field()
    public room: string;

    @Field()
    public matchId: number;
}
