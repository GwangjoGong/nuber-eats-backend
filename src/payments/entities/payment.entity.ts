import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(is => String)
  @Column()
  transactionId: string;

  @Field(is => User)
  @ManyToOne(
    to => User,
    user => user.payments,
    { onDelete: 'SET NULL' },
  )
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @Field(is => Restaurant)
  @ManyToOne(to => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
