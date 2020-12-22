import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(is => String)
  item: string;

  @Field(is => Number, { nullable: true })
  cost?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(is => String)
  name: string;

  @Field(is => [DishChoice])
  choices: DishChoice[];

  @Field(is => Number, { nullable: true })
  cost?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(is => String)
  @Column()
  @Length(5)
  @IsString()
  name: string;

  @Field(is => Number)
  @Column()
  @IsNumber()
  price: number;

  @Field(is => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo: string;

  @Field(is => String)
  @Column()
  @Length(5, 140)
  @IsString()
  description: string;

  @Field(is => Restaurant)
  @ManyToOne(
    to => Restaurant,
    restaurant => restaurant.menu,
    { onDelete: 'CASCADE' },
  )
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field(is => [DishOption])
  @Column({ type: 'json' })
  options: DishOption[];
}
