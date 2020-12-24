import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field(is => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field(is => String)
  @IsString()
  password: string;

  @Column({ default: false })
  @Field(is => Boolean, { defaultValue: false })
  @IsBoolean()
  verified: boolean;

  @Column({ type: 'enum', enum: UserRole })
  @Field(is => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field(is => [Restaurant])
  @OneToMany(
    to => Restaurant,
    restaurant => restaurant.owner,
  )
  restaurants: Restaurant[];

  @Field(is => [Order])
  @OneToMany(
    to => Order,
    order => order.customer,
  )
  orders: Order[];

  @Field(is => [Payment])
  @OneToMany(
    to => Payment,
    payment => payment.user,
  )
  payments: Payment[];

  @Field(is => [Order])
  @OneToMany(
    to => Order,
    order => order.driver,
  )
  rides: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (err) {
        console.log(err);
        throw new InternalServerErrorException();
      }
    }
  }

  checkPassword(aPassword: string): Promise<boolean> {
    try {
      return bcrypt.compare(aPassword, this.password);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }
}
