import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { BcryptService } from '../crypto/bcrypt.service';
import { User } from '../../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcrypt: BcryptService,
  ) {}

  async create(userDto: CreateUserDto) {
    const { email, password } = userDto;
    const existEmail = await this.usersRepository.getUserByEmail(email);
    if (existEmail) throw new ConflictException('Email already in use.');

    return await this.usersRepository.create({
      ...userDto,
      password: this.bcrypt.hash(password),
    });
  }

  async getUserByEmail(email: string) {
    return await this.usersRepository.getUserByEmail(email);
  }

  isMatchForPassword(
    user: { id: number; password: string },
    password: string,
  ): boolean {
    const pass = this.bcrypt.isMatch(password, user.password);
    return pass;
  }

  async getUserById(id: number) {
    const user = await this.usersRepository.getUserById(id);
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }
}
