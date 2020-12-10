import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEmail, IsEnum, IsString } from 'class-validator';

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
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
  verfied: boolean;

  @Column({ type: 'enum', enum: UserRole })
  @Field(is => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

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
