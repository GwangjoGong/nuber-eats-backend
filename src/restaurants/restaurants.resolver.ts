import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import {
  CategoryRestaurantInput,
  CategoryRestaurantOutput,
} from './dtos/category-restaurant.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurants.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(returns => RestaurantsOutput)
  restaurants(
    @Args('input') restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantService.allRestaurants(restaurantsInput);
  }

  @Query(returns => RestaurantOutput)
  restaurant(
    @Args('input') restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantService.findRestaurantById(restaurantInput);
  }

  @Query(returns => SearchRestaurantOutput)
  searchRestaurants(
    @Args('input') searchRestaurantsInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurants(searchRestaurantsInput);
  }

  @Mutation(returns => CreateRestaurantOutput)
  @Role(['Owner'])
  createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurantInput,
    @AuthUser() user: User,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(createRestaurantInput, user);
  }

  @Mutation(returns => EditRestaurantOutput)
  @Role(['Owner'])
  editRestaurant(
    @Args('input') editRestaurantInput: EditRestaurantInput,
    @AuthUser() user: User,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(editRestaurantInput, user);
  }

  @Mutation(returns => DeleteRestaurantOutput)
  @Role(['Owner'])
  deleteRestaurant(
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
    @AuthUser() user: User,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(deleteRestaurantInput, user);
  }
}

@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField(is => Number)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.getRestaurantCount(category);
  }

  @Query(returns => AllCategoriesOutput)
  allCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantService.allCategories();
  }

  @Query(returns => CategoryRestaurantOutput)
  categoryRestaurant(
    @Args('input') categoryRestaurantInput: CategoryRestaurantInput,
  ): Promise<CategoryRestaurantOutput> {
    return this.restaurantService.findCategoryBySlug(categoryRestaurantInput);
  }
}
