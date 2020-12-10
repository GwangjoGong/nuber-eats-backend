import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CoreOutput {
  @Field(is => String, { nullable: true })
  error?: string;

  @Field(is => Boolean)
  ok: boolean;
}
