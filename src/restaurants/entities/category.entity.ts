import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(is => String)
  @Column({ unique: true })
  @Length(5)
  @IsString()
  name: string;

  @Field(is => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImage: string;

  @Field(is => String)
  @Column({ unique: true })
  @IsString()
  slug: string;

  @Field(is => [Restaurant])
  @OneToMany(
    () => Restaurant,
    restaurant => restaurant.category,
  )
  restaurants: Restaurant[];
}
