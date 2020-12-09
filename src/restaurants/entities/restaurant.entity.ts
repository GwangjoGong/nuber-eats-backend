import { Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @Field(is => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(is => String)
  @Column()
  @Length(5)
  @IsString()
  name: string;

  @Field(is => Boolean, { defaultValue: false })
  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field(is => String)
  @Column()
  @IsString()
  address: string;

  @Field(is => String)
  @Column()
  @IsString()
  ownerName: string;
}
