import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import {
  CategoryRestaurantInput,
  CategoryRestaurantOutput,
} from './dtos/category-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
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
import { CategoryRepository } from './repositories/category.repository';
import { DishRepository } from './repositories/dish.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
    private readonly dishes: DishRepository,
  ) {}

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalCount] = await this.restaurants.findAndCount({
        take: 25,
        skip: (page - 1) * 25,
      });

      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalCount / 25),
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot load restaurants',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        { id: restaurantId },
        { relations: ['menu'] },
      );
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant does not exist',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot find restaurant',
      };
    }
  }

  async searchRestaurants({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalCount] = await this.restaurants.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      return {
        ok: true,
        totalPages: Math.ceil(totalCount / 25),
        restaurants,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot search restaurants',
      };
    }
  }

  async createRestaurant(
    createRestaurantInput: CreateRestaurantInput,
    owner: User,
  ): Promise<CreateRestaurantOutput> {
    try {
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      const newRestaurant = this.restaurants.create({
        ...createRestaurantInput,
        owner,
        category,
      });

      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create a restaurant',
      };
    }
  }

  async editRestaurant(
    editRestaurantInput: EditRestaurantInput,
    owner: User,
  ): Promise<EditRestaurantOutput> {
    try {
      const result = await this.restaurants.findAndValidate(
        editRestaurantInput.restaurantId,
        owner,
      );
      if (!result.ok) {
        return result;
      }

      let category: Category = null;

      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit restaurant',
      };
    }
  }

  async deleteRestaurant(
    deleteRestaurantInput: DeleteRestaurantInput,
    owner: User,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const result = await this.restaurants.findAndValidate(
        deleteRestaurantInput.restaurantId,
        owner,
      );
      if (!result.ok) {
        return result;
      }

      await this.restaurants.delete({ id: deleteRestaurantInput.restaurantId });

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot delete restaurant',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    const allCategories = await this.categories.find();
    return {
      ok: true,
      categories: allCategories,
    };
  }

  async getRestaurantCount(category: Category): Promise<number> {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryRestaurantInput): Promise<CategoryRestaurantOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: 'Could not find category',
        };
      }

      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        take: 25,
        skip: (page - 1) * 25,
      });

      const totalPages = Math.ceil(
        (await this.getRestaurantCount(category)) / 25,
      );

      return {
        ok: true,
        category,
        restaurants,
        totalPages,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load category',
      };
    }
  }

  async createDish(
    user: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const { ok, error, restaurant } = await this.restaurants.findAndValidate(
        createDishInput.restaurantId,
        user,
      );
      if (!ok) {
        return {
          ok,
          error,
        };
      }

      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot create dish',
      };
    }
  }

  async editDish(
    user: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const { ok, error } = await this.dishes.findAndValidate(
        editDishInput.dishId,
        user,
      );
      if (!ok) {
        return {
          ok,
          error,
        };
      }

      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot edit dish',
      };
    }
  }

  async deleteDish(
    user: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const { ok, error, dish } = await this.dishes.findAndValidate(
        deleteDishInput.dishId,
        user,
      );
      if (!ok) {
        return {
          ok,
          error,
        };
      }

      await this.dishes.delete(dish.id);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot delete dish',
      };
    }
  }
}
