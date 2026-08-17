import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { User } from '../../generated/prisma/client';
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
  private readonly AUDIENCE = 'users';
  private readonly ISSUER = 'Fabricio';

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

    if (!user) {
      throw new UnauthorizedException('Email or password not valid.');
    }

    const valid = this.usersService.isMatchForPassword(user, password);

    if (!valid) {
      throw new UnauthorizedException('Email or password not valid.');
    }

    const result = this.createToken(user);

    await this.authRepository.createSession(Number(user.id), result.token);

    return {
      token: result.token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(token: string) {
    await this.authRepository.deleteSession(token);

    return {
      message: 'Logout successful',
    };
  }

  createToken(user: User) {
    const token = this.jwtService.sign({
      email: user.email,
      sub: String(user.id),
    });

    return { token };
  }

  checkToken(token: string): JwtPayload {
    try {
      const data = this.jwtService.verify(token, {
        audience: this.AUDIENCE,
        issuer: this.ISSUER,
      });
      return data as JwtPayload;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
