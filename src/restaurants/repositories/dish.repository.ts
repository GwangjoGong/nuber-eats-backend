import { User } from 'src/users/entities/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { Dish } from '../entities/dish.entity';

@EntityRepository(Dish)
export class DishRepository extends Repository<Dish> {
  async findAndValidate(id: number, owner: User) {
    const dish = await this.findOne({ id }, { relations: ['restaurant'] });
    if (!dish) {
      return {
        ok: false,
        error: 'Could not find dish',
      };
    }

    if (owner.id !== dish.restaurant.ownerId) {
      return {
        ok: false,
        error: 'Not authorized',
      };
    }

    return {
      ok: true,
      dish,
    };
  }
}
