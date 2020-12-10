import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@ArgsType()
export class UserProfileInput {
  @Field(is => Number)
  id: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field(is => User, { nullable: true })
  user?: User;
}
