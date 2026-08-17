import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../common/roles.decorator';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  function createContext(user?: any) {
    const handler = jest.fn();
    const controller = jest.fn();

    const request = { user };

    const context = {
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(controller),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;

    return { context, handler, controller };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    const { context } = createContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw when roles are required but the user is missing', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue(['ORGANIZER']);

    const { context } = createContext();

    expect(() => guard.canActivate(context)).toThrow(
      ForbiddenException,
    );
  });

  it('should allow a user whose role is required', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue(['ORGANIZER']);

    const { context } = createContext({
      id: 1,
      role: 'ORGANIZER',
    });

    expect(guard.canActivate(context)).toBe(true);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
  });

  it('should allow a user when any of the required roles matches', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue(['CLIENT', 'ORGANIZER']);

    const { context } = createContext({
      id: 1,
      role: 'CLIENT',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw when the user has insufficient role', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue(['GATEKEEPER']);

    const { context } = createContext({
      id: 1,
      role: 'CLIENT',
    });

    expect(() => guard.canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
});
