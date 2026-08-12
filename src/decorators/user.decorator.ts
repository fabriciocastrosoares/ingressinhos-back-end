import {
  createParamDecorator,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';

export const User = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    const user = request.user;
    if (!user) throw new NotFoundException('User not found.');

    return user;
  },
);
