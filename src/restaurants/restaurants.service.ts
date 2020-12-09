import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.find({});
  }

  async create(restaurantData: CreateRestaurantDto): Promise<boolean> {
    try {
      const newRestaurant = this.restaurantRepository.create(restaurantData);
      await this.restaurantRepository.save(newRestaurant);
      return true;
    } catch {
      return false;
    }
  }

  async update({ id, data }: UpdateRestaurantDto): Promise<boolean> {
    try {
      await this.restaurantRepository.update(id, { ...data });
      return true;
    } catch {
      return false;
    }
  }
}
