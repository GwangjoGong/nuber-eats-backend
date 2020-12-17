import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';

@EntityRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  async findAndValidate(id: number, owner: User): Promise<CoreOutput> {
    const restaurant = await this.findOne({ id });
    if (!restaurant) {
      return {
        ok: false,
        error: 'Could not find restaurant',
      };
    }

    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: 'You cannot delete restaurant you do not own',
      };
    }

    return {
      ok: true,
    };
  }
}
