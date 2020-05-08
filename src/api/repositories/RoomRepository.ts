import { EntityRepository, Repository } from 'typeorm';

import { Room } from '../models/Room';

@EntityRepository(Room)
export class RoomRepository extends Repository<Room>  {

}
