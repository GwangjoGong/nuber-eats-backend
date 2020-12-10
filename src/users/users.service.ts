import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
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

      const token = this.jwtService.sign(user.id);

      return {
        ok: true,
        token,
      };
    } catch {
      return {
        ok: false,
        error: "Couln't log in user",
      };
    }
  }

  findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  async update(id: number, { email, password }: EditProfileInput) {
    const user = await this.findById(id);
    if (email) {
      user.email = email;
    }

    if (password) {
      user.password = password;
    }
    return this.users.save(user);
  }
}
