import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(is => User, { nullable: true })
  @ManyToOne(
    to => User,
    user => user.orders,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @Field(is => User, { nullable: true })
  @ManyToOne(
    to => User,
    user => user.rides,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @Field(is => Restaurant, { nullable: true })
  @ManyToOne(
    to => Restaurant,
    restaurant => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  restaurant?: Restaurant;

  @Field(is => [OrderItem])
  @ManyToMany(to => OrderItem, { eager: true })
  @JoinTable()
  items: OrderItem[];

  @Field(is => Number, { nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  total?: number;

  @Field(is => OrderStatus, { defaultValue: 'Pending' })
  @Column({ type: 'enum', enum: OrderStatus, default: 'Pending' })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
