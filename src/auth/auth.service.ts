import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { User } from '@prisma/client';
interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
  aud?: string;
  iss?: string;
}
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async signUp(signupDto: SignupDto) {
    return await this.usersService.create(signupDto);
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.usersService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('Email or password not valid.');

    const valid = this.usersService.isMatchForPassword(user, password);
    if (!valid) throw new UnauthorizedException('Email or password not valid.');

    const result = this.createToken(user);

    try {
      await this.authRepository.createSession(String(user.id), result.token);
    } catch (e) {
      // ignore session save errors for now
    }

    return result;
  }

  createToken(user: { id: string | number; email: string }) {
    const { id, email } = user;
    const token = this.jwtService.sign({ email, sub: String(id) });
    return { token };
  }

  checkToken(token: string): JwtPayload {
    try {
      const data = this.jwtService.verify(token, {
        audience: 'users',
        issuer: 'Fabricio',
      });
      return data as JwtPayload;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
