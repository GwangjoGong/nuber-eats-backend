import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AllowedRole } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!roles) return true;

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext['token'];
    if (!token) {
      return false;
    }

    let user: User;

    try {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user: foundUser } = await this.usersService.userProfile(
          decoded['id'],
        );
        user = foundUser;
      }
    } catch {
      return false;
    }

    if (!user) return false;

    gqlContext['user'] = user;
    return roles.includes('Any') || roles.includes(user.role);
  }
}
