import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { DishRepository } from 'src/restaurants/repositories/dish.repository';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      RestaurantRepository,
      DishRepository,
      OrderItem,
    ]),
  ],
  providers: [OrdersService, OrdersResolver],
})
export class OrdersModule {}
