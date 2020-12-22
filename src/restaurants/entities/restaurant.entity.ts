import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(is => String)
  @Column()
  @Length(5)
  @IsString()
  name: string;

  @Field(is => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field(is => String)
  @Column()
  @IsString()
  address: string;

  @Field(is => Category, { nullable: true })
  @ManyToOne(
    to => Category,
    category => category.restaurants,
    { nullable: true, onDelete: 'SET NULL' },
  )
  category: Category;

  @Field(is => [Dish], { defaultValue: [] })
  @OneToMany(
    to => Dish,
    dish => dish.restaurant,
  )
  menu: Dish[];

  @Field(is => [Order], { defaultValue: [] })
  @OneToMany(
    to => Order,
    order => order.restaurant,
  )
  orders: Order[];

  @Field(is => User)
  @ManyToOne(
    to => User,
    user => user.restaurants,
    { onDelete: 'CASCADE' },
  )
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;
}
