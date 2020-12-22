import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItemOption extends CoreEntity {
  @Field(is => String)
  name: string;

  @Field(is => String, { nullable: true })
  choice?: string;

  @Field(is => Number, { nullable: true })
  cost?: number;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @Field(is => [Dish])
  @ManyToOne(to => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field(is => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: OrderItemOption[];
}
