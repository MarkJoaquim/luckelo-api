import { Field, ObjectType } from 'type-graphql';
import { User } from './User';

@ObjectType({
    description: 'Charm object.',
})
export class Charm {
    @Field()
    public id: number;

    @Field()
    public charm: number;

    @Field()
    public palette: string;

    @Field()
    public name: string;

    @Field()
    public user: User;
}
