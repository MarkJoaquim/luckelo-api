import { Field, ObjectType } from 'type-graphql';

@ObjectType({
    description: 'Match object.',
})
export class BalderdashMatch {

    @Field()
    public id: number;

    @Field()
    public created: Date;

    @Field()
    public room: string;
}
