import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
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
  async userProfile(
    @Args() { id }: UserProfileInput,
  ): Promise<UserProfileOutput> {
    try {
      const user = await this.usersSerivce.findById(id);
      if (!user) {
        throw Error();
      }
      return {
        ok: true,
        user,
      };
    } catch {
      return {
        ok: false,
        error: 'User not found',
      };
    }
  }

  @Mutation(returns => CreateUserOutput)
  async createUser(
    @Args('input') createUserInput: CreateUserInput,
  ): Promise<CreateUserOutput> {
    try {
      return this.usersSerivce.createUser(createUserInput);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @Mutation(returns => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return this.usersSerivce.login(loginInput);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => EditProfileOutput)
  async editProfile(
    @AuthUser() user,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      await this.usersSerivce.update(user.id, editProfileInput);
      return {
        ok: true,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
