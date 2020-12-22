import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteDishInput {
  @Field(is => Number)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
