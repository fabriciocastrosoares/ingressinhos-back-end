import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();

    const { authorization } = request.headers;
    if (!authorization)
      throw new UnauthorizedException('Authorization Header is missing');
    const token = authorization.split(' ')[1];
    try {
      const { sub } = this.authService.checkToken(token);
      const user = await this.usersService.getUserById(sub);
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
