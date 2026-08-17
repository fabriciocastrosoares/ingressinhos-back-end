import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthGuard } from './auth.guards';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

describe('AuthGuard', () => {
  const usersService = {
    getUserById: jest.fn(),
  };

  const authService = {
    checkToken: jest.fn(),
  };

  const guard = new AuthGuard(
    usersService as unknown as UsersService,
    authService as unknown as AuthService,
  );

  function createContext(headers: Record<string, string | undefined>) {
    const request: any = { headers };

    const http = {
      getRequest: jest.fn().mockReturnValue(request),
    };

    const context = {
      switchToHttp: jest.fn().mockReturnValue(http),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw when authorization header is missing', async () => {
    const { context } = createContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(authService.checkToken).not.toHaveBeenCalled();
    expect(usersService.getUserById).not.toHaveBeenCalled();
  });

  it('should throw when token validation fails', async () => {
    const { context } = createContext({
      authorization: 'Bearer invalid-token',
    });

    authService.checkToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw when the user cannot be found', async () => {
    const { context } = createContext({
      authorization: 'Bearer valid-token',
    });

    authService.checkToken.mockReturnValue({ sub: '10' });
    usersService.getUserById.mockRejectedValue(new Error('User not found'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(usersService.getUserById).toHaveBeenCalledWith(10);
  });

  it('should authenticate the user and attach it to the request', async () => {
    const { context, request } = createContext({
      authorization: 'Bearer valid-token',
    });

    const user = {
      id: 10,
      username: 'testuser',
      email: 'test@example.com',
      role: 'CLIENT',
    };

    authService.checkToken.mockReturnValue({ sub: '10' });
    usersService.getUserById.mockResolvedValue(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(authService.checkToken).toHaveBeenCalledWith('valid-token');
    expect(usersService.getUserById).toHaveBeenCalledWith(10);
    expect(request.user).toBe(user);
  });

  it('should use the token after the Bearer prefix', async () => {
    const { context } = createContext({
      authorization: 'Bearer another-token',
    });

    authService.checkToken.mockReturnValue({ sub: '20' });
    usersService.getUserById.mockResolvedValue({ id: 20 });

    await guard.canActivate(context);

    expect(authService.checkToken).toHaveBeenCalledWith('another-token');
  });
});
