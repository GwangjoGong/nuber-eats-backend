import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createUser({
    email,
    password,
    role,
  }: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      const newUser = this.users.create({ email, password, role });
      await this.users.save(newUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Couldn't create user" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({ email });
      const correct = await user.checkPassword(password);
      if (!correct) {
        return {
          ok: false,
          error: 'Check your email and password',
        };
      }

      return {
        ok: true,
        token: 'Test token',
      };
    } catch {
      return {
        ok: false,
        error: "Couln't log in user",
      };
    }
  }
}
