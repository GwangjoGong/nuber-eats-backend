import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(of => User)
export class UsersResolver {
  constructor(private readonly usersSerivce: UsersService) {}

  @Query(returns => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() user: User) {
    return user;
  }

  @Query(returns => UserProfileOutput)
  @UseGuards(AuthGuard)
  userProfile(@Args() { id }: UserProfileInput): Promise<UserProfileOutput> {
    return this.usersSerivce.userProfile(id);
  }

  @Mutation(returns => CreateUserOutput)
  createUser(
    @Args('input') createUserInput: CreateUserInput,
  ): Promise<CreateUserOutput> {
    return this.usersSerivce.createUser(createUserInput);
  }

  @Mutation(returns => LoginOutput)
  login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersSerivce.login(loginInput);
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => EditProfileOutput)
  editProfile(
    @AuthUser() user: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersSerivce.editProfile(user.id, editProfileInput);
  }

  @Mutation(returns => VerifyEmailOutput)
  verifyEmail(
    @Args('input') verfiyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersSerivce.verifyEmail(verfiyEmailInput);
  }
}
