import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class CategoryRestaurantInput extends PaginationInput {
  @Field(is => String)
  slug: string;
}

@ObjectType()
export class CategoryRestaurantOutput extends PaginationOutput {
  @Field(is => Category, { nullable: true })
  category?: Category;

  @Field(is => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
