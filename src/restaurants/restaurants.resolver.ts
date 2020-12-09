import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(returns => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Mutation(returns => Boolean)
  createRestaurant(
    @Args('input') restaurantData: CreateRestaurantDto,
  ): Promise<boolean> {
    return this.restaurantService.create(restaurantData);
  }

  @Mutation(returns => Boolean)
  updateRestaurant(@Args() updateRestaurantData: UpdateRestaurantDto) {
    return this.restaurantService.update(updateRestaurantData);
  }
}
